import { z } from "zod";

export type ModelClient = {
  readonly kind: "anthropic" | "test-stub";
  generateStructured<TSchema extends z.ZodType>(
    request: ModelStructuredRequest<TSchema>
  ): Promise<z.infer<TSchema>>;
};

export type ModelStructuredRequest<TSchema extends z.ZodType> = {
  system: string;
  user: string;
  schema: TSchema;
};

export function assertProductionModelClient(client: ModelClient, env = process.env.NODE_ENV) {
  if (env === "production" && client.kind === "test-stub") {
    throw new Error("Refusing to boot production with test-stub model client");
  }
}

