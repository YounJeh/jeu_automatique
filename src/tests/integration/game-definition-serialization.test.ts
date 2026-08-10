import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";

describe("GameDefinition serialization round-trip", () => {
  it("survives a JSON stringify/parse round-trip unchanged", () => {
    const roundTripped: unknown = JSON.parse(
      JSON.stringify(dodgeGameDefinitionExample),
    );

    const result = gameDefinitionSchema.safeParse(roundTripped);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual(dodgeGameDefinitionExample);
  });

  it('rejects a version other than "1" after round-trip', () => {
    const mutated = { ...dodgeGameDefinitionExample, version: "2" };
    const roundTripped: unknown = JSON.parse(JSON.stringify(mutated));

    expect(gameDefinitionSchema.safeParse(roundTripped).success).toBe(false);
  });

  it("rejects an unknown top-level field after round-trip", () => {
    const mutated = { ...dodgeGameDefinitionExample, extra: "nope" };
    const roundTripped: unknown = JSON.parse(JSON.stringify(mutated));

    expect(gameDefinitionSchema.safeParse(roundTripped).success).toBe(false);
  });

  it("rejects a RuleAction outside the closed union after round-trip", () => {
    const mutated = {
      ...dodgeGameDefinitionExample,
      rules: [{ when: "timer-expired", then: [{ type: "teleport" }] }],
    };
    const roundTripped: unknown = JSON.parse(JSON.stringify(mutated));

    expect(gameDefinitionSchema.safeParse(roundTripped).success).toBe(false);
  });

  it("rejects a GoalDefinition outside the closed union after round-trip", () => {
    const mutated = {
      ...dodgeGameDefinitionExample,
      goals: [{ type: "collect-all", target: 5 }],
    };
    const roundTripped: unknown = JSON.parse(JSON.stringify(mutated));

    expect(gameDefinitionSchema.safeParse(roundTripped).success).toBe(false);
  });

  it("rejects a definition missing a required top-level field after round-trip", () => {
    const mutated: Record<string, unknown> = {
      ...dodgeGameDefinitionExample,
    };
    delete mutated.metadata;
    const roundTripped: unknown = JSON.parse(JSON.stringify(mutated));

    expect(gameDefinitionSchema.safeParse(roundTripped).success).toBe(false);
  });
});
