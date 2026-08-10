import { describe, expect, it } from "vitest";
import { goalDefinitionSchema } from "../../game/definition/goal-definition-schema.js";

describe("goalDefinitionSchema", () => {
  it("accepts a valid survive goal", () => {
    expect(
      goalDefinitionSchema.safeParse({
        type: "survive",
        durationSeconds: 30,
      }).success,
    ).toBe(true);
  });

  it("accepts a valid score goal", () => {
    expect(
      goalDefinitionSchema.safeParse({ type: "score", target: 100 }).success,
    ).toBe(true);
  });

  it("accepts a valid destroy goal", () => {
    expect(
      goalDefinitionSchema.safeParse({ type: "destroy", target: 20 }).success,
    ).toBe(true);
  });

  it("rejects a type outside the closed union", () => {
    expect(
      goalDefinitionSchema.safeParse({ type: "collect-all", target: 20 })
        .success,
    ).toBe(false);
  });

  it("rejects a missing required parameter per variant", () => {
    expect(goalDefinitionSchema.safeParse({ type: "survive" }).success).toBe(
      false,
    );
    expect(goalDefinitionSchema.safeParse({ type: "score" }).success).toBe(
      false,
    );
    expect(goalDefinitionSchema.safeParse({ type: "destroy" }).success).toBe(
      false,
    );
  });

  it("rejects a non-positive target", () => {
    expect(
      goalDefinitionSchema.safeParse({ type: "score", target: 0 }).success,
    ).toBe(false);
  });
});
