import { describe, expect, it } from "vitest";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { collectGameDefinitionExample } from "../../game/definition/examples/collect-game-definition.js";
import { templateMechanics } from "../../game/mechanics/template-mechanics.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";

describe("collectGameDefinitionExample", () => {
  it("validates against gameDefinitionSchema", () => {
    expect(
      gameDefinitionSchema.safeParse(collectGameDefinitionExample).success,
    ).toBe(true);
  });

  it("has no semantic error issues", () => {
    const report = createSemanticValidator(
      gameDefinitionSemanticRules,
    ).validate(collectGameDefinitionExample);
    expect(report.valid).toBe(true);
  });

  it("is playable", () => {
    const report = createPlayabilityValidator(
      gameDefinitionPlayabilityRules,
    ).validate(collectGameDefinitionExample);
    expect(report.playable).toBe(true);
  });

  it("reuses templateMechanics.collect exactly (PHASE 4), not a hand-copied list", () => {
    expect(collectGameDefinitionExample.mechanics).toBe(
      templateMechanics.collect,
    );
  });
});
