import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAnthropicModelClient, ModelOutputParseError } from "./anthropic-client.js";

const StructuredSchema = z.object({
  status: z.literal("ok"),
  answer: z.string()
});

describe("createAnthropicModelClient", () => {
  it("requires an API key", () => {
    expect(() => createAnthropicModelClient({ apiKey: "" })).toThrow(
      "ANTHROPIC_API_KEY is required"
    );
  });

  it("parses structured JSON from the text block", async () => {
    const calls: RequestInit[] = [];
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      model: "claude-fable-5",
      fetchFn: async (_url, init) => {
        calls.push(init);
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ status: "ok", answer: "ready" })
                }
              ]
            };
          },
          async text() {
            return "";
          }
        };
      }
    });

    const result = await client.generateStructured({
      system: "Return a status.",
      user: "Check readiness.",
      schema: StructuredSchema
    });

    expect(result).toEqual({ status: "ok", answer: "ready" });
    expect(calls[0]?.headers).toMatchObject({
      "x-api-key": "test-key",
      "anthropic-version": "2023-06-01"
    });
  });

  it("parses structured JSON from a fenced text block", async () => {
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      fetchFn: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            content: [
              {
                type: "text",
                text: '```json\n{"status":"ok","answer":"fenced"}\n```'
              }
            ]
          };
        },
        async text() {
          return "";
        }
      })
    });

    await expect(
      client.generateStructured({
        system: "Return a status.",
        user: "Check readiness.",
        schema: StructuredSchema
      })
    ).resolves.toEqual({ status: "ok", answer: "fenced" });
  });

  it("aborts and fails closed if the request outlasts the timeout", async () => {
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      timeoutMs: 20,
      fetchFn: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        })
    });

    await expect(
      client.generateStructured({
        system: "Return a status.",
        user: "Check readiness.",
        schema: StructuredSchema
      })
    ).rejects.toThrow("Anthropic request timed out after 20ms");
  });

  it("reports upstream errors without treating them as generated output", async () => {
    const calls: RequestInit[] = [];
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      fetchFn: async (_url, init) => {
        calls.push(init);
        return {
        ok: false,
        status: 401,
        async json() {
          return {};
        },
        async text() {
          return "invalid key";
        }
      };
      },
      retryBaseDelayMs: 0
    });

    await expect(
      client.generateStructured({
        system: "Return a status.",
        user: "Check readiness.",
        schema: StructuredSchema
      })
    ).rejects.toThrow("Anthropic request failed with HTTP 401: invalid key");
    expect(calls).toHaveLength(1);
  });

  it("retries transient upstream overloads before returning structured output", async () => {
    let calls = 0;
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      maxRetries: 2,
      retryBaseDelayMs: 0,
      fetchFn: async () => {
        calls += 1;

        if (calls < 3) {
          return {
            ok: false,
            status: 529,
            async json() {
              return {};
            },
            async text() {
              return "overloaded";
            }
          };
        }

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ status: "ok", answer: "recovered" })
                }
              ]
            };
          },
          async text() {
            return "";
          }
        };
      }
    });

    await expect(
      client.generateStructured({
        system: "Return a status.",
        user: "Check readiness.",
        schema: StructuredSchema
      })
    ).resolves.toEqual({ status: "ok", answer: "recovered" });
    expect(calls).toBe(3);
  });

  it("retries malformed model JSON and reports a typed parse error if it keeps failing", async () => {
    let calls = 0;
    const client = createAnthropicModelClient({
      apiKey: "test-key",
      maxRetries: 1,
      retryBaseDelayMs: 0,
      fetchFn: async () => {
        calls += 1;
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              content: [
                {
                  type: "text",
                  text: "not json"
                }
              ]
            };
          },
          async text() {
            return "";
          }
        };
      }
    });

    await expect(
      client.generateStructured({
        system: "Return a status.",
        user: "Check readiness.",
        schema: StructuredSchema
      })
    ).rejects.toThrow(ModelOutputParseError);
    expect(calls).toBe(2);
  });
});
