import { describe, expect, it } from "vitest";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";

const validator = createSemanticValidator(gameDefinitionSemanticRules);

const cleanDefinition: GameDefinition = {
  version: "1",
  metadata: {
    id: "dodge-game",
    title: "Meteor Dodge",
    description: "Évite les météorites le plus longtemps possible.",
    theme: "space",
  },
  world: { width: 480, height: 640, boundaries: "clamp", durationSeconds: 30 },
  player: {
    speed: 220,
    size: 28,
    appearance: { type: "shape", shape: "rectangle", color: "#4fd1c5" },
  },
  entities: [
    {
      id: "obstacle-1",
      kind: "obstacle",
      size: 28,
      speed: 160,
      spawnIntervalMs: 700,
      appearance: { type: "shape", shape: "rectangle", color: "#f56565" },
    },
  ],
  mechanics: ["move", "avoid", "timer"],
  rules: [
    { when: "player-collides-obstacle", then: [{ type: "lose-game" }] },
    { when: "timer-expired", then: [{ type: "win-game" }] },
  ],
  goals: [{ type: "survive", durationSeconds: 30 }],
  presentation: {
    backgroundColor: "#0b1021",
    victoryMessage: "Vaisseau sauvé !",
    defeatMessage: "Vaisseau détruit...",
  },
};

describe("gameDefinitionSemanticRules", () => {
  it("has no issues on a coherent GameDefinition", () => {
    expect(validator.validate(cleanDefinition).issues).toEqual([]);
  });

  it("flags an entity spawnIntervalMs exceeding world.durationSeconds", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      entities: [{ ...cleanDefinition.entities[0]!, spawnIntervalMs: 60_000 }],
    };

    const report = validator.validate(definition);
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "ENTITY_SPAWN_EXCEEDS_DURATION",
    });
  });

  it("flags an incoherent mechanics set (missing dependency)", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      mechanics: ["shoot"],
    };

    const report = validator.validate(definition);
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "MISSING_MECHANIC_DEPENDENCY",
    });
  });

  it("flags a spawn-entity action referencing an unknown entity", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      rules: [
        {
          when: "timer-expired",
          then: [{ type: "spawn-entity", entityId: "ghost" }],
        },
      ],
    };

    const report = validator.validate(definition);
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "UNKNOWN_SPAWN_ENTITY_REFERENCE",
    });
  });

  it("flags an unreachable destroy goal (no enemy entity)", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      goals: [{ type: "destroy", target: 5 }],
    };

    const report = validator.validate(definition);
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "UNREACHABLE_DESTROY_GOAL",
    });
  });

  it("flags an unreachable score goal (no increase-score action)", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      goals: [{ type: "score", target: 100 }],
    };

    const report = validator.validate(definition);
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "UNREACHABLE_SCORE_GOAL",
    });
  });

  it("accepts a destroy goal when an enemy entity exists", () => {
    const definition: GameDefinition = {
      ...cleanDefinition,
      entities: [
        ...cleanDefinition.entities,
        {
          id: "enemy-1",
          kind: "enemy",
          size: 24,
          appearance: { type: "shape", shape: "circle", color: "#111" },
        },
      ],
      goals: [{ type: "destroy", target: 5 }],
    };

    expect(validator.validate(definition).valid).toBe(true);
  });
});
