import { z } from "zod";
import type { ModelClient, ModelStructuredRequest } from "./model-client.js";

type FetchLike = (
  url: string,
  init: RequestInit
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicResponseBlock = {
  [key: string]: unknown;
  type: string;
  text?: string | undefined;
};

const AnthropicMessageResponseSchema = z.object({
  content: z.array(
    z
      .object({
        type: z.string(),
        text: z.string().optional()
      })
      .passthrough()
  )
});

export type AnthropicModelClientOptions = {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  fetchFn?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  retryJitterMs?: number;
};

const defaultTimeoutMs = 20_000;
const defaultMaxRetries = 2;
const defaultRetryBaseDelayMs = 400;
const defaultRetryJitterMs = 150;
const retryableHttpStatuses = new Set([429, 500, 502, 503, 529]);

export class ModelOutputParseError extends Error {
  constructor(cause: unknown) {
    super("model returned unparseable output");
    this.name = "ModelOutputParseError";
    this.cause = cause;
  }
}

class AnthropicHTTPError extends Error {
  constructor(
    readonly status: number,
    body: string
  ) {
    super(`Anthropic request failed with HTTP ${status}: ${body}`);
    this.name = "AnthropicHTTPError";
  }
}

class AnthropicNetworkError extends Error {
  constructor(cause: unknown) {
    super(`Anthropic request failed before response: ${cause instanceof Error ? cause.message : "network error"}`);
    this.name = "AnthropicNetworkError";
    this.cause = cause;
  }
}

export function createAnthropicModelClient(options: AnthropicModelClientOptions = {}): ModelClient {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to create the Anthropic model client");
  }

  const model = options.model ?? process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
  const maxTokens = options.maxTokens ?? 4000;
  const fetchFn = options.fetchFn ?? fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.ANTHROPIC_REQUEST_TIMEOUT_MS ?? defaultTimeoutMs);
  const maxRetries = options.maxRetries ?? defaultMaxRetries;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? defaultRetryBaseDelayMs;
  const retryJitterMs = options.retryJitterMs ?? defaultRetryJitterMs;

  return {
    kind: "anthropic",
    async generateStructured<TSchema extends z.ZodType>(
      request: ModelStructuredRequest<TSchema>
    ): Promise<z.infer<TSchema>> {
      // A paid deliverable is generated on the synchronous request path before x402 settlement.
      // An unbounded call here lets a slow model response outlast the buyer's own client/gateway
      // timeout, so the buyer's connection can be dropped while AgentForge still goes on to settle
      // payment afterward. Aborting here fails closed, before any payment is settled.
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        try {
          const response = await callAnthropicMessages({
            apiKey,
            fetchFn,
            maxTokens,
            model,
            request,
            timeoutMs
          });

          if (!response.ok) {
            throw new AnthropicHTTPError(response.status, await response.text());
          }

          const payload = AnthropicMessageResponseSchema.parse(await response.json());
          const textBlock = payload.content.find(isTextBlock);

          if (!textBlock) {
            throw new Error("Anthropic response did not include a text block");
          }

          return request.schema.parse(parseModelJson(textBlock.text));
        } catch (error) {
          if (attempt >= maxRetries || !isRetryableAnthropicError(error)) {
            throw error;
          }

          await sleep(retryDelayMs(attempt, retryBaseDelayMs, retryJitterMs));
        }
      }

      throw new Error("Anthropic request retry loop exited unexpectedly");
    }
  };
}

async function callAnthropicMessages(input: {
  apiKey: string;
  fetchFn: FetchLike;
  maxTokens: number;
  model: string;
  request: ModelStructuredRequest<z.ZodType>;
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    return await input.fetchFn("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: input.model,
        max_tokens: input.maxTokens,
        system: `${input.request.system}\n\nReturn only valid JSON. Do not wrap it in Markdown.`,
        messages: [
          {
            role: "user",
            content: input.request.user
          }
        ]
      }),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Anthropic request timed out after ${input.timeoutMs}ms`);
    }

    throw new AnthropicNetworkError(error);
  } finally {
    clearTimeout(timeout);
  }
}

function parseModelJson(text: string) {
  try {
    return JSON.parse(extractJsonText(text));
  } catch (error) {
    throw new ModelOutputParseError(error);
  }
}

function isRetryableAnthropicError(error: unknown) {
  if (error instanceof AnthropicHTTPError) {
    return retryableHttpStatuses.has(error.status);
  }

  return error instanceof AnthropicNetworkError || error instanceof ModelOutputParseError;
}

function retryDelayMs(attempt: number, baseDelayMs: number, jitterMs: number) {
  if (baseDelayMs <= 0) {
    return 0;
  }

  return baseDelayMs * 2 ** attempt + Math.floor(Math.random() * Math.max(0, jitterMs));
}

async function sleep(ms: number) {
  if (ms <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isTextBlock(block: AnthropicResponseBlock): block is AnthropicTextBlock {
  return block.type === "text" && typeof block.text === "string";
}

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}
