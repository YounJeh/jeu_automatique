import { describe, expect, it } from "vitest";
import { isGenericRuntimeCapable } from "../../game/core/runtime/generic-runtime-capability.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";
import { collectGameDefinitionExample } from "../../game/definition/examples/collect-game-definition.js";
import { shooterPreset } from "../../game/presets/shooter.js";

describe("isGenericRuntimeCapable", () => {
  it("is true for dodge", () => {
    expect(isGenericRuntimeCapable(dodgeGameDefinitionExample)).toBe(true);
  });

  it("is true for collect", () => {
    expect(isGenericRuntimeCapable(collectGameDefinitionExample)).toBe(true);
  });

  it("is false for shooter (declares the shoot mechanic)", () => {
    expect(isGenericRuntimeCapable(shooterPreset.definition)).toBe(false);
  });
});
