import { afterEach, describe, expect, it } from "vitest";
import { getBuiltInGames } from "../../game/catalog/built-in-games.js";
import { getGamePreset } from "../../game/presets/registry.js";

const ORIGINAL_VALUE = process.env.GENERIC_RUNTIME_ENABLED;

afterEach(() => {
  if (ORIGINAL_VALUE === undefined) {
    delete process.env.GENERIC_RUNTIME_ENABLED;
  } else {
    process.env.GENERIC_RUNTIME_ENABLED = ORIGINAL_VALUE;
  }
});

describe("getBuiltInGames — GENERIC_RUNTIME_ENABLED off", () => {
  it("has exactly the 3 legacy-backed entries, no survival", () => {
    delete process.env.GENERIC_RUNTIME_ENABLED;

    expect(getBuiltInGames().map((game) => game.template)).toEqual([
      "dodge",
      "collect",
      "shooter",
    ]);
  });

  it("populates definition with the matching preset's definition", () => {
    delete process.env.GENERIC_RUNTIME_ENABLED;

    for (const game of getBuiltInGames()) {
      expect(game.definition).toBe(getGamePreset(game.template).definition);
    }
  });

  it("leaves the legacy config field untouched", () => {
    delete process.env.GENERIC_RUNTIME_ENABLED;

    for (const game of getBuiltInGames()) {
      expect(game.config?.template).toBe(game.template);
    }
  });
});

describe("getBuiltInGames — GENERIC_RUNTIME_ENABLED on", () => {
  it("adds a config-less survival entry", () => {
    process.env.GENERIC_RUNTIME_ENABLED = "true";

    const games = getBuiltInGames();
    expect(games.map((game) => game.template)).toEqual([
      "dodge",
      "collect",
      "shooter",
      "survival",
    ]);

    const survival = games.find((game) => game.template === "survival")!;
    expect(survival.config).toBeUndefined();
    expect(survival.definition).toBe(getGamePreset("survival").definition);
  });
});
