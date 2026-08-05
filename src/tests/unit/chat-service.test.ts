import { describe, expect, it } from "vitest";
import {
  MAX_GAME_PROMPT_LENGTH,
  buildGameConfigFromPrompt,
  generateGameFromPrompt,
  selectTemplateFromPrompt,
} from "../../app/services/chat-service.js";
import { gameConfigSchema } from "../../mastra/schemas/generated-game-schema.js";

describe("selectTemplateFromPrompt", () => {
  it("selects the collect template for a collect-themed prompt", () => {
    expect(
      selectTemplateFromPrompt("Un jeu où je dois collecter des cristaux"),
    ).toBe("collect");
  });

  it("selects the dodge template by default", () => {
    expect(selectTemplateFromPrompt("Un jeu de vaisseau spatial rapide")).toBe(
      "dodge",
    );
  });
});

describe("buildGameConfigFromPrompt", () => {
  it("produces a valid dodge configuration", () => {
    const config = buildGameConfigFromPrompt("Évite les astéroïdes", "dodge");
    expect(gameConfigSchema.safeParse(config).success).toBe(true);
    expect(config.template).toBe("dodge");
  });

  it("produces a valid collect configuration", () => {
    const config = buildGameConfigFromPrompt(
      "Collecte des cristaux magiques",
      "collect",
    );
    expect(gameConfigSchema.safeParse(config).success).toBe(true);
    expect(config.template).toBe("collect");
  });
});

describe("generateGameFromPrompt", () => {
  it("resolves a valid generated game and reports progress", async () => {
    const statuses: string[] = [];

    const result = await generateGameFromPrompt(
      "Un jeu de collecte de cristaux dans une grotte",
      (status) => statuses.push(status),
      0,
    );

    expect(result.game.template).toBe("collect");
    expect(result.summary.length).toBeGreaterThan(0);
    expect(statuses).toEqual([
      "analyzing",
      "generating",
      "validating",
      "saving",
      "ready",
    ]);
  });

  it("rejects an empty prompt", async () => {
    await expect(
      generateGameFromPrompt("   ", undefined, 0),
    ).rejects.toMatchObject({
      code: "INVALID_PROMPT",
    });
  });

  it("rejects a prompt that is too long", async () => {
    const longPrompt = "a".repeat(MAX_GAME_PROMPT_LENGTH + 1);
    await expect(
      generateGameFromPrompt(longPrompt, undefined, 0),
    ).rejects.toMatchObject({
      code: "INVALID_PROMPT",
    });
  });
});
