import { describe, expect, it } from "vitest";
import { generateGameResponseSchema } from "../../mastra/schemas/generate-game-api-schema.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";

describe("generateGameResponseSchema", () => {
  it("accepts a successful response", () => {
    const response = {
      success: true,
      result: {
        id: "generated-1",
        game: defaultDodgeConfig,
        template: "dodge",
        summary: "Un jeu généré.",
        generationId: "generation-1",
        createdAt: new Date().toISOString(),
      },
    };

    expect(generateGameResponseSchema.safeParse(response).success).toBe(true);
  });

  it("accepts an error response", () => {
    const response = {
      success: false,
      error: { code: "INVALID_PROMPT", message: "Prompt invalide." },
    };

    expect(generateGameResponseSchema.safeParse(response).success).toBe(true);
  });

  it("rejects a success response without a result", () => {
    expect(
      generateGameResponseSchema.safeParse({ success: true }).success,
    ).toBe(false);
  });

  it("rejects an error response without an error payload", () => {
    expect(
      generateGameResponseSchema.safeParse({ success: false }).success,
    ).toBe(false);
  });
});
