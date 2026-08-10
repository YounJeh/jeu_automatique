import { describe, expect, it } from "vitest";
import { playerDefinitionSchema } from "../../game/definition/player-definition-schema.js";

const validPlayer = {
  speed: 220,
  size: 28,
  appearance: {
    type: "shape" as const,
    shape: "rectangle" as const,
    color: "#4fd1c5",
  },
};

describe("playerDefinitionSchema", () => {
  it("accepts a valid player without health", () => {
    expect(playerDefinitionSchema.safeParse(validPlayer).success).toBe(true);
  });

  it("accepts a valid player with health", () => {
    expect(
      playerDefinitionSchema.safeParse({ ...validPlayer, health: 3 }).success,
    ).toBe(true);
  });

  it("rejects a speed outside bounds", () => {
    expect(
      playerDefinitionSchema.safeParse({ ...validPlayer, speed: 50 }).success,
    ).toBe(false);
  });

  it("rejects a non-positive size", () => {
    expect(
      playerDefinitionSchema.safeParse({ ...validPlayer, size: 0 }).success,
    ).toBe(false);
  });

  it("rejects an invalid appearance (composed sub-schema failure)", () => {
    expect(
      playerDefinitionSchema.safeParse({
        ...validPlayer,
        appearance: { type: "sprite", assetId: "x" },
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown field", () => {
    expect(
      playerDefinitionSchema.safeParse({ ...validPlayer, extra: "nope" })
        .success,
    ).toBe(false);
  });
});
