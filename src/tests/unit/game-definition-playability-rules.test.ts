import { describe, expect, it } from "vitest";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";

const validator = createPlayabilityValidator(gameDefinitionPlayabilityRules);

const playableDefinition: GameDefinition = {
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

describe("gameDefinitionPlayabilityRules", () => {
  it("is playable for dodge-equivalent values", () => {
    const report = validator.validate(playableDefinition);
    expect(report.playable).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("flags a player larger than the world", () => {
    const definition: GameDefinition = {
      ...playableDefinition,
      player: { ...playableDefinition.player, size: 700 },
    };

    const report = validator.validate(definition);
    expect(report.playable).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "PLAYER_DOES_NOT_FIT_WORLD",
    });
  });

  it("flags an entity that can cover the entire world width", () => {
    const definition: GameDefinition = {
      ...playableDefinition,
      entities: [
        {
          ...playableDefinition.entities[0]!,
          spawnIntervalMs: 200,
        },
      ],
    };

    const report = validator.validate(definition);
    expect(report.playable).toBe(false);
    expect(report.issues[0]).toMatchObject({ code: "ENTITY_COVERS_WORLD" });
  });

  it("flags excessive entity pressure relative to player speed", () => {
    const definition: GameDefinition = {
      ...playableDefinition,
      player: { ...playableDefinition.player, speed: 100 },
      entities: [
        {
          id: "obstacle-1",
          kind: "obstacle",
          size: 20,
          speed: 500,
          spawnIntervalMs: 300,
          appearance: { type: "shape", shape: "rectangle", color: "#f56565" },
        },
      ],
    };

    const report = validator.validate(definition);
    expect(report.playable).toBe(false);
    expect(report.issues[0]).toMatchObject({
      code: "EXCESSIVE_ENTITY_PRESSURE",
    });
  });

  it("ignores entities without both speed and spawnIntervalMs", () => {
    const definition: GameDefinition = {
      ...playableDefinition,
      entities: [
        {
          id: "collectible-1",
          kind: "collectible",
          size: 20,
          spawnIntervalMs: 900,
          appearance: { type: "shape", shape: "circle", color: "#facc15" },
        },
      ],
    };

    expect(validator.validate(definition).playable).toBe(true);
  });
});
