import { describe, expect, it } from "vitest";
import { applyRules } from "../../game/core/runtime/rule-engine.js";
import type { GameRule } from "../../game/definition/rule-definition-schema.js";
import type { RuntimeEntity } from "../../game/core/runtime/runtime-state.js";

const obstacle: RuntimeEntity = {
  id: "obstacle-1",
  kind: "obstacle",
  position: { x: 0, y: 0 },
};
const collectible: RuntimeEntity = {
  id: "collectible-1",
  kind: "collectible",
  position: { x: 0, y: 0 },
};

describe("applyRules", () => {
  it("returns a neutral outcome when no trigger matches any rule", () => {
    const rules: GameRule[] = [
      { when: "timer-expired", then: [{ type: "win-game" }] },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-obstacle", hitEntities: [] },
    ]);

    expect(outcome).toEqual({
      scoreDelta: 0,
      healthDelta: 0,
      removedEntityIds: new Set(),
      spawnEntityIds: [],
      status: null,
    });
  });

  it("increases score by the action amount", () => {
    const rules: GameRule[] = [
      {
        when: "player-collides-collectible",
        then: [{ type: "increase-score", amount: 10 }],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-collectible", hitEntities: [collectible] },
    ]);

    expect(outcome.scoreDelta).toBe(10);
  });

  it("removes exactly the hitEntities, not every entity of that kind", () => {
    const otherCollectible: RuntimeEntity = {
      id: "collectible-2",
      kind: "collectible",
      position: { x: 5, y: 5 },
    };
    const rules: GameRule[] = [
      {
        when: "player-collides-collectible",
        then: [{ type: "remove-entity" }],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-collectible", hitEntities: [collectible] },
    ]);

    expect(outcome.removedEntityIds).toEqual(new Set(["collectible-1"]));
    expect(outcome.removedEntityIds.has(otherCollectible.id)).toBe(false);
  });

  it("accumulates healthDelta from damage-player", () => {
    const rules: GameRule[] = [
      {
        when: "player-collides-enemy",
        then: [{ type: "damage-player", amount: 1 }],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-enemy", hitEntities: [] },
    ]);

    expect(outcome.healthDelta).toBe(1);
  });

  it("collects spawn-entity entityIds", () => {
    const rules: GameRule[] = [
      {
        when: "timer-expired",
        then: [{ type: "spawn-entity", entityId: "boss-1" }],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "timer-expired", hitEntities: [] },
    ]);

    expect(outcome.spawnEntityIds).toEqual(["boss-1"]);
  });

  it("sets status to lost/won from lose-game/win-game", () => {
    const loseRules: GameRule[] = [
      { when: "health-zero", then: [{ type: "lose-game" }] },
    ];
    const winRules: GameRule[] = [
      { when: "score-reached", then: [{ type: "win-game" }] },
    ];

    expect(
      applyRules(loseRules, [{ event: "health-zero", hitEntities: [] }]).status,
    ).toBe("lost");
    expect(
      applyRules(winRules, [{ event: "score-reached", hitEntities: [] }])
        .status,
    ).toBe("won");
  });

  it("applies multiple actions from a single rule's then array", () => {
    const rules: GameRule[] = [
      {
        when: "player-collides-collectible",
        then: [
          { type: "increase-score", amount: 10 },
          { type: "remove-entity" },
        ],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-collectible", hitEntities: [collectible] },
    ]);

    expect(outcome.scoreDelta).toBe(10);
    expect(outcome.removedEntityIds).toEqual(new Set(["collectible-1"]));
  });

  it("merges effects from multiple triggers in the same call", () => {
    const rules: GameRule[] = [
      {
        when: "player-collides-collectible",
        then: [{ type: "increase-score", amount: 10 }],
      },
      {
        when: "player-collides-obstacle",
        then: [{ type: "lose-game" }],
      },
    ];

    const outcome = applyRules(rules, [
      { event: "player-collides-collectible", hitEntities: [collectible] },
      { event: "player-collides-obstacle", hitEntities: [obstacle] },
    ]);

    expect(outcome.scoreDelta).toBe(10);
    expect(outcome.status).toBe("lost");
  });
});
