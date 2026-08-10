import { describe, expect, it } from "vitest";
import { appearanceDefinitionSchema } from "../../game/definition/appearance-definition-schema.js";

describe("appearanceDefinitionSchema", () => {
  it("accepts a valid shape appearance", () => {
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "shape",
        shape: "rectangle",
        color: "#4fd1c5",
      }).success,
    ).toBe(true);
  });

  it("accepts circle and triangle shapes", () => {
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "shape",
        shape: "circle",
        color: "#000",
      }).success,
    ).toBe(true);
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "shape",
        shape: "triangle",
        color: "rgba(10, 20, 30, 0.5)",
      }).success,
    ).toBe(true);
  });

  it("rejects a sprite variant (deferred to PHASE 9)", () => {
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "sprite",
        assetId: "spaceship-blue",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown shape", () => {
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "shape",
        shape: "hexagon",
        color: "#000",
      }).success,
    ).toBe(false);
  });

  it("rejects an invalid CSS color", () => {
    expect(
      appearanceDefinitionSchema.safeParse({
        type: "shape",
        shape: "rectangle",
        color: "not-a-color",
      }).success,
    ).toBe(false);
  });
});
