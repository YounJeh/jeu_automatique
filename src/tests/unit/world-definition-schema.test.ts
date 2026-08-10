import { describe, expect, it } from "vitest";
import { worldDefinitionSchema } from "../../game/definition/world-definition-schema.js";

const validWorld = {
  width: 480,
  height: 640,
  boundaries: "clamp" as const,
  durationSeconds: 30,
};

describe("worldDefinitionSchema", () => {
  it("accepts a valid world with durationSeconds", () => {
    expect(worldDefinitionSchema.safeParse(validWorld).success).toBe(true);
  });

  it("accepts a valid world without durationSeconds", () => {
    const { durationSeconds: _durationSeconds, ...withoutDuration } =
      validWorld;
    expect(worldDefinitionSchema.safeParse(withoutDuration).success).toBe(true);
  });

  it("rejects a boundaries value outside the closed union", () => {
    expect(
      worldDefinitionSchema.safeParse({ ...validWorld, boundaries: "wrap" })
        .success,
    ).toBe(false);
  });

  it("rejects a non-positive width", () => {
    expect(
      worldDefinitionSchema.safeParse({ ...validWorld, width: 0 }).success,
    ).toBe(false);
  });

  it("rejects a negative durationSeconds", () => {
    expect(
      worldDefinitionSchema.safeParse({ ...validWorld, durationSeconds: -1 })
        .success,
    ).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(
      worldDefinitionSchema.safeParse({ ...validWorld, extra: "nope" }).success,
    ).toBe(false);
  });
});
