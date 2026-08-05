import { beforeEach, describe, expect, it } from "vitest";
import { generateGameMock } from "../../app/services/chat-service.js";
import { GameGenerationError } from "../../app/errors/game-generation-error.js";
import type { GenerationStatus } from "../../app/types/generation-status.js";
import {
  findGameById,
  resetGeneratedGames,
} from "../../game/catalog/game-catalog.js";

beforeEach(() => {
  resetGeneratedGames();
});

describe("generateGameMock", () => {
  it("selects the dodge template for a generic prompt", async () => {
    const result = await generateGameMock(
      "Un jeu où j'évite des astéroïdes dans l'espace",
      () => {},
      { stepDelayMs: 0 },
    );

    expect(result.game.template).toBe("dodge");
  });

  it("selects the collect template when the prompt mentions collecting", async () => {
    const result = await generateGameMock(
      "Un jeu où je dois collecter des cristaux magiques",
      () => {},
      { stepDelayMs: 0 },
    );

    expect(result.game.template).toBe("collect");
  });

  it("adds the generated game to the catalog", async () => {
    const result = await generateGameMock("Un jeu de test", () => {}, {
      stepDelayMs: 0,
    });

    const item = findGameById(result.game.id);
    expect(item).toBeDefined();
    expect(item?.source).toBe("generated");
    expect(item?.config).toEqual(result.game);
  });

  it("emits the expected generation statuses in order", async () => {
    const statuses: GenerationStatus[] = [];

    await generateGameMock(
      "Un jeu de test",
      (status) => statuses.push(status),
      {
        stepDelayMs: 0,
      },
    );

    expect(statuses).toEqual([
      "sending",
      "analyzing",
      "generating",
      "validating",
      "saving",
      "ready",
    ]);
  });

  it("rejects an empty prompt without touching the catalog", async () => {
    const statuses: GenerationStatus[] = [];

    await expect(
      generateGameMock("   ", (status) => statuses.push(status), {
        stepDelayMs: 0,
      }),
    ).rejects.toThrow(GameGenerationError);

    expect(statuses).toEqual(["sending", "error"]);
  });

  it("rejects a prompt that is too long", async () => {
    const longPrompt = "a".repeat(1001);

    await expect(
      generateGameMock(longPrompt, () => {}, { stepDelayMs: 0 }),
    ).rejects.toMatchObject({ code: "INVALID_PROMPT" });
  });
});
