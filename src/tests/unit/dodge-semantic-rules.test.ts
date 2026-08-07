import { describe, expect, it } from "vitest";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { dodgeSemanticRules } from "../../game/validation/semantic/dodge-semantic-rules.js";

const dodgeSemanticValidator = createSemanticValidator(dodgeSemanticRules);

describe("dodge semantic rules", () => {
  it("a normal configuration is valid with no issues", () => {
    const report = dodgeSemanticValidator.validate(defaultDodgeConfig);

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("warns about an anormally short game duration without blocking it", () => {
    const report = dodgeSemanticValidator.validate({
      ...defaultDodgeConfig,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "UNUSUAL_GAME_DURATION",
    ]);
  });

  it("warns about an anormally long game duration without blocking it", () => {
    const report = dodgeSemanticValidator.validate({
      ...defaultDodgeConfig,
      gameDurationSeconds: 120,
    });

    expect(report.valid).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "UNUSUAL_GAME_DURATION",
    ]);
  });
});
