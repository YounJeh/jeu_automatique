import { beforeEach, describe, expect, it } from "vitest";
import { resetGeneratedGames } from "../../game/catalog/game-catalog.js";
import {
  listGames,
  saveGeneratedGame,
} from "../../app/services/game-catalog-service.js";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import type { GeneratedGameResult } from "../../mastra/schemas/generated-game-schema.js";

beforeEach(() => {
  resetGeneratedGames();
});

describe("game-catalog-service", () => {
  it("lists the built-in games", () => {
    expect(listGames().map((item) => item.id)).toEqual([
      "dodge-game",
      "collect-game",
      "shooter-game",
    ]);
  });

  it("saves a valid generated game to the catalog", () => {
    const result: GeneratedGameResult = {
      game: { ...defaultDodgeConfig, id: "generated-dodge-1" },
      summary: "Un jeu généré.",
      generationId: "generation-1",
      createdAt: new Date().toISOString(),
    };

    const savedItem = saveGeneratedGame(result);

    expect(savedItem.source).toBe("generated");
    expect(savedItem.template).toBe("dodge");
    expect(listGames()).toHaveLength(4);
    expect(listGames().map((item) => item.id)).toContain(savedItem.id);
  });
});
