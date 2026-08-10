import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";

describe("dodgeGameDefinitionExample", () => {
  it("validates against gameDefinitionSchema", () => {
    expect(
      gameDefinitionSchema.safeParse(dodgeGameDefinitionExample).success,
    ).toBe(true);
  });

  it("has no semantic error issues", () => {
    const report = createSemanticValidator(
      gameDefinitionSemanticRules,
    ).validate(dodgeGameDefinitionExample);
    expect(report.valid).toBe(true);
  });

  it("is playable", () => {
    const report = createPlayabilityValidator(
      gameDefinitionPlayabilityRules,
    ).validate(dodgeGameDefinitionExample);
    expect(report.playable).toBe(true);
  });

  it("reuses templateMechanics.dodge exactly (PHASE 4), not a hand-copied list", () => {
    expect(dodgeGameDefinitionExample.mechanics).toBe(templateMechanics.dodge);
  });
});
