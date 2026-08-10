import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";

const validDefinition = {
  version: "1" as const,
  metadata: {
    id: "dodge-game",
    title: "Meteor Dodge",
    description: "Évite les météorites le plus longtemps possible.",
    theme: "space",
  },
  world: {
    width: 480,
    height: 640,
    boundaries: "clamp" as const,
    durationSeconds: 30,
  },
  player: {
    speed: 220,
    size: 28,
    appearance: {
      type: "shape" as const,
      shape: "rectangle" as const,
      color: "#4fd1c5",
    },
  },
  entities: [
    {
      id: "obstacle-1",
      kind: "obstacle" as const,
      size: 28,
      speed: 160,
      spawnIntervalMs: 700,
      appearance: {
        type: "shape" as const,
        shape: "rectangle" as const,
        color: "#f56565",
      },
    },
  ],
  mechanics: ["move", "avoid", "timer"] as const,
  rules: [
    {
      when: "player-collides-obstacle" as const,
      then: [{ type: "lose-game" as const }],
    },
    {
      when: "timer-expired" as const,
      then: [{ type: "win-game" as const }],
    },
  ],
  goals: [{ type: "survive" as const, durationSeconds: 30 }],
  presentation: {
    backgroundColor: "#0b1021",
    victoryMessage: "Vaisseau sauvé !",
    defeatMessage: "Vaisseau détruit...",
  },
};

describe("gameDefinitionSchema", () => {
  it("accepts a fully valid GameDefinition", () => {
    const result = gameDefinitionSchema.safeParse(validDefinition);
    expect(result.success).toBe(true);
  });

  it('rejects a version other than "1"', () => {
    expect(
      gameDefinitionSchema.safeParse({ ...validDefinition, version: "2" })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown top-level field", () => {
    expect(
      gameDefinitionSchema.safeParse({ ...validDefinition, extra: "nope" })
        .success,
    ).toBe(false);
  });

  it("rejects an empty mechanics array", () => {
    expect(
      gameDefinitionSchema.safeParse({ ...validDefinition, mechanics: [] })
        .success,
    ).toBe(false);
  });

  it("rejects an empty goals array", () => {
    expect(
      gameDefinitionSchema.safeParse({ ...validDefinition, goals: [] }).success,
    ).toBe(false);
  });

  it("propagates a nested metadata validation failure", () => {
    expect(
      gameDefinitionSchema.safeParse({
        ...validDefinition,
        metadata: { ...validDefinition.metadata, title: "ab" },
      }).success,
    ).toBe(false);
  });

  it("propagates a nested rule validation failure", () => {
    expect(
      gameDefinitionSchema.safeParse({
        ...validDefinition,
        rules: [{ when: "timer-expired", then: [] }],
      }).success,
    ).toBe(false);
  });

  it("accepts an empty entities and rules array", () => {
    expect(
      gameDefinitionSchema.safeParse({
        ...validDefinition,
        entities: [],
        rules: [],
      }).success,
    ).toBe(true);
  });
});
