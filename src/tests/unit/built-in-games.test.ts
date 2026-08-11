import { describe, expect, it } from "vitest";
import { builtInGames } from "../../game/catalog/built-in-games.js";
import { getGamePreset } from "../../game/presets/registry.js";

describe("builtInGames", () => {
  it("has 3 entries, one per template", () => {
    expect(builtInGames.map((game) => game.template)).toEqual([
      "dodge",
      "collect",
      "shooter",
    ]);
  });

  it("populates definition with the matching preset's definition", () => {
    for (const game of builtInGames) {
      expect(game.definition).toBe(getGamePreset(game.template).definition);
    }
  });

  it("leaves the legacy config field untouched", () => {
    for (const game of builtInGames) {
      expect(game.config?.template).toBe(game.template);
    }
  });
});
