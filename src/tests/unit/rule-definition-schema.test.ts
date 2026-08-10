import { describe, expect, it } from "vitest";
import {
  RULE_EVENTS,
  gameRuleSchema,
  ruleActionSchema,
  ruleEventSchema,
} from "../../game/definition/rule-definition-schema.js";

describe("ruleEventSchema", () => {
  it.each(RULE_EVENTS)("accepts each closed rule event: %s", (event) => {
    expect(ruleEventSchema.safeParse(event).success).toBe(true);
  });

  it("rejects an event outside the closed union", () => {
    expect(ruleEventSchema.safeParse("player-jumps").success).toBe(false);
  });
});

describe("ruleActionSchema", () => {
  it("accepts increase-score with amount", () => {
    expect(
      ruleActionSchema.safeParse({ type: "increase-score", amount: 10 })
        .success,
    ).toBe(true);
  });

  it("accepts damage-player with amount", () => {
    expect(
      ruleActionSchema.safeParse({ type: "damage-player", amount: 1 }).success,
    ).toBe(true);
  });

  it("accepts spawn-entity with entityId", () => {
    expect(
      ruleActionSchema.safeParse({
        type: "spawn-entity",
        entityId: "obstacle-1",
      }).success,
    ).toBe(true);
  });

  it.each(["remove-entity", "win-game", "lose-game"])(
    "accepts %s with no parameters",
    (type) => {
      expect(ruleActionSchema.safeParse({ type }).success).toBe(true);
    },
  );

  it("rejects increase-score missing its amount", () => {
    expect(ruleActionSchema.safeParse({ type: "increase-score" }).success).toBe(
      false,
    );
  });

  it("rejects a parameter-less action carrying an unexpected field", () => {
    expect(
      ruleActionSchema.safeParse({ type: "win-game", amount: 10 }).success,
    ).toBe(false);
  });

  it("rejects a type outside the closed union", () => {
    expect(ruleActionSchema.safeParse({ type: "teleport" }).success).toBe(
      false,
    );
  });
});

describe("gameRuleSchema", () => {
  it("accepts a valid rule with one action", () => {
    expect(
      gameRuleSchema.safeParse({
        when: "player-collides-obstacle",
        then: [{ type: "lose-game" }],
      }).success,
    ).toBe(true);
  });

  it("accepts a valid rule with multiple actions", () => {
    expect(
      gameRuleSchema.safeParse({
        when: "player-collides-collectible",
        then: [
          { type: "increase-score", amount: 10 },
          { type: "remove-entity" },
        ],
      }).success,
    ).toBe(true);
  });

  it("rejects an empty then array", () => {
    expect(
      gameRuleSchema.safeParse({ when: "timer-expired", then: [] }).success,
    ).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(
      gameRuleSchema.safeParse({
        when: "timer-expired",
        then: [{ type: "win-game" }],
        extra: "nope",
      }).success,
    ).toBe(false);
  });
});
