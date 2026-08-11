import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { survivalPreset } from "../../game/presets/survival.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { isGenericRuntimeCapable } from "../../game/core/runtime/generic-runtime-capability.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";

describe("survivalPreset", () => {
  it("validates against gameDefinitionSchema", () => {
    expect(
      gameDefinitionSchema.safeParse(survivalPreset.definition).success,
    ).toBe(true);
  });

  it("has no semantic error issues", () => {
    const report = createSemanticValidator(
      gameDefinitionSemanticRules,
    ).validate(survivalPreset.definition);
    expect(report.valid).toBe(true);
  });

  it("is playable", () => {
    const report = createPlayabilityValidator(
      gameDefinitionPlayabilityRules,
    ).validate(survivalPreset.definition);
    expect(report.playable).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it("reuses templateMechanics.survival exactly, including avoid and health", () => {
    expect(survivalPreset.definition.mechanics).toBe(
      templateMechanics.survival,
    );
    expect(survivalPreset.definition.mechanics).toContain("avoid");
    expect(survivalPreset.definition.mechanics).toContain("health");
  });

  it("declares a seek entity", () => {
    expect(
      survivalPreset.definition.entities.some(
        (entity) => entity.movementPattern === "seek",
      ),
    ).toBe(true);
  });

  it("is executable by GenericRuntime (no shoot mechanic)", () => {
    expect(isGenericRuntimeCapable(survivalPreset.definition)).toBe(true);
  });
});
