import { describe, expect, it } from "vitest";
import type { InputState } from "../../game/core/game-state.js";
import { validateMechanicSet } from "../../game/mechanics/compatibility.js";
import {
  defaultHybridPocConfig,
  hybridPocMechanics,
} from "../../game/mechanics/hybrid-poc/hybrid-poc-config.js";
import { HybridPocEngine } from "../../game/mechanics/hybrid-poc/hybrid-poc-engine.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import {
  gameTemplateDefinitions,
  listGameTemplateDefinitions,
} from "../../game/templates/game-template-catalog.js";

const noInput: InputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
};

describe("hybrid mechanics composition (move + collect + avoid)", () => {
  it("validates cleanly against the mechanic registry", () => {
    expect(validateMechanicSet(hybridPocMechanics)).toEqual([]);
  });

  it("actually loses at runtime when the avoid path is triggered by an obstacle collision", () => {
    const engine = new HybridPocEngine(
      {
        ...defaultHybridPocConfig,
        obstacleSpawnIntervalMs: 250,
        obstacleSpeed: 500,
      },
      () => 0.5, // obstacle spawns aligned with the player's x position
    );

    engine.update(250, noInput);
    const state = engine.update(400, noInput); // falls onto the centered player

    expect(state.status).toBe("lost");
  });

  it("actually wins at runtime when the collect path reaches its target", () => {
    const engine = new HybridPocEngine(
      {
        ...defaultHybridPocConfig,
        collectibleSpawnIntervalMs: 100,
        targetCollectibleCount: 3,
        obstacleSpawnIntervalMs: 100_000, // avoid mechanic present but not triggered here
      },
      () => 0.5, // collectibles spawn aligned with the player's position
    );

    let state = engine.update(100, noInput);
    expect(state.collectedCount).toBe(1);
    state = engine.update(100, noInput);
    expect(state.collectedCount).toBe(2);
    state = engine.update(100, noInput);

    expect(state.collectedCount).toBe(3);
    expect(state.status).toBe("won");
  });

  it("rejects an incomplete mechanic set missing a required dependency", () => {
    const issues = validateMechanicSet(["shoot"]);

    expect(issues).toEqual([
      {
        severity: "error",
        code: "MISSING_MECHANIC_DEPENDENCY",
        message: '"shoot" requires "move" to also be present',
      },
    ]);
  });

  it("never registers the hybrid POC as a selectable game template", () => {
    expect(GAME_TEMPLATES).toHaveLength(3);
    expect(GAME_TEMPLATES).toEqual(["dodge", "collect", "shooter"]);
    expect(GAME_TEMPLATES).not.toContain("hybrid-poc");

    expect(Object.keys(gameTemplateDefinitions).sort()).toEqual([
      "collect",
      "dodge",
      "shooter",
    ]);

    const ids = listGameTemplateDefinitions().map(
      (definition) => definition.id,
    );
    expect(ids).not.toContain("hybrid-poc");
  });
});
