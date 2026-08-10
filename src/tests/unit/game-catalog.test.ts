import { beforeEach, describe, expect, it } from "vitest";
import {
  addGeneratedGame,
  findGameById,
  getCatalog,
  resetGeneratedGames,
} from "../../game/catalog/game-catalog.js";
import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";

beforeEach(() => {
  resetGeneratedGames();
});

function makeGeneratedItem(id: string): GameCatalogItem {
  return {
    id,
    title: "Jeu généré",
    description: "Un jeu généré pour les tests unitaires.",
    template: "collect",
    source: "generated",
    config: { ...defaultCollectConfig, id },
  };
}

describe("game catalog", () => {
  it("loads the three built-in games", () => {
    const catalog = getCatalog();

    expect(catalog).toHaveLength(3);
    expect(catalog.map((item) => item.id)).toEqual([
      "dodge-game",
      "collect-game",
      "shooter-game",
    ]);
  });

  it("selects a game by id", () => {
    expect(findGameById("dodge-game")?.template).toBe("dodge");
    expect(findGameById("collect-game")?.template).toBe("collect");
    expect(findGameById("shooter-game")?.template).toBe("shooter");
    expect(findGameById("unknown-game")).toBeUndefined();
  });

  it("adds a generated game to the catalog", () => {
    addGeneratedGame(makeGeneratedItem("collect-custom"));

    const catalog = getCatalog();
    expect(catalog).toHaveLength(4);
    expect(findGameById("collect-custom")?.source).toBe("generated");
  });

  it("rejects a duplicate id", () => {
    expect(() => addGeneratedGame(makeGeneratedItem("dodge-game"))).toThrow();
  });

  it("does not allow direct mutation of the catalog", () => {
    const catalog = getCatalog();
    catalog.push(makeGeneratedItem("mutated-game"));

    expect(getCatalog()).toHaveLength(3);
  });
});
