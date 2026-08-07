import { describe, expect, it } from "vitest";
import {
  createSemanticValidator,
  type SemanticRule,
} from "../../game/validation/semantic/semantic-validator.js";

type FakeConfig = { value: number };

describe("createSemanticValidator", () => {
  it("is valid with no rules", () => {
    const validator = createSemanticValidator<FakeConfig>([]);

    expect(validator.validate({ value: 1 })).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("ignores rules that return null", () => {
    const alwaysNull: SemanticRule<FakeConfig> = () => null;
    const validator = createSemanticValidator([alwaysNull]);

    expect(validator.validate({ value: 1 })).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("stays valid when a rule raises a warning", () => {
    const warningRule: SemanticRule<FakeConfig> = () => ({
      severity: "warning",
      code: "SOME_WARNING",
      message: "just a warning",
    });
    const validator = createSemanticValidator([warningRule]);

    const report = validator.validate({ value: 1 });

    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([
      { severity: "warning", code: "SOME_WARNING", message: "just a warning" },
    ]);
  });

  it("becomes invalid when a rule raises an error", () => {
    const errorRule: SemanticRule<FakeConfig> = () => ({
      severity: "error",
      code: "SOME_ERROR",
      message: "blocking issue",
    });
    const validator = createSemanticValidator([errorRule]);

    const report = validator.validate({ value: 1 });

    expect(report.valid).toBe(false);
    expect(report.issues).toEqual([
      { severity: "error", code: "SOME_ERROR", message: "blocking issue" },
    ]);
  });

  it("aggregates issues from multiple rules", () => {
    const warningRule: SemanticRule<FakeConfig> = () => ({
      severity: "warning",
      code: "WARNING_CODE",
      message: "warning",
    });
    const errorRule: SemanticRule<FakeConfig> = () => ({
      severity: "error",
      code: "ERROR_CODE",
      message: "error",
    });
    const nullRule: SemanticRule<FakeConfig> = () => null;
    const validator = createSemanticValidator([
      warningRule,
      errorRule,
      nullRule,
    ]);

    const report = validator.validate({ value: 1 });

    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "WARNING_CODE",
      "ERROR_CODE",
    ]);
  });
});
