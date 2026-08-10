import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { shooterPreset } from "../../game/presets/shooter.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";

describe("shooterPreset", () => {
  it("validates against gameDefinitionSchema", () => {
    expect(
      gameDefinitionSchema.safeParse(shooterPreset.definition).success,
    ).toBe(true);
  });

  it("has no semantic error issues", () => {
    const report = createSemanticValidator(
      gameDefinitionSemanticRules,
    ).validate(shooterPreset.definition);
    expect(report.valid).toBe(true);
  });

  it("is playable", () => {
    const report = createPlayabilityValidator(
      gameDefinitionPlayabilityRules,
    ).validate(shooterPreset.definition);
    expect(report.playable).toBe(true);
  });

  it("reuses templateMechanics.shooter exactly, including shoot", () => {
    expect(shooterPreset.definition.mechanics).toBe(templateMechanics.shooter);
    expect(shooterPreset.definition.mechanics).toContain("shoot");
  });
});
