import { beforeEach, describe, expect, it } from "vitest";
import { resetGeneratedGames } from "../../game/catalog/game-catalog.js";
import {
  listGames,
  saveGeneratedGame,
} from "../../app/services/game-catalog-service.js";
import { generateGameFromPrompt } from "../../app/services/chat-service.js";

beforeEach(() => {
  resetGeneratedGames();
});

describe("game-catalog-service", () => {
  it("lists the built-in games", () => {
    expect(listGames().map((item) => item.id)).toEqual([
      "dodge-game",
      "collect-game",
    ]);
  });

  it("saves a valid generated game to the catalog", async () => {
    const result = await generateGameFromPrompt(
      "Un jeu où j'évite des météorites",
      undefined,
      0,
    );

    const savedItem = saveGeneratedGame(result);

    expect(savedItem.source).toBe("generated");
    expect(savedItem.template).toBe("dodge");
    expect(listGames()).toHaveLength(3);
    expect(listGames().map((item) => item.id)).toContain(savedItem.id);
  });
});
