import { describe, expect, it } from "vitest";
import {
  createPlayabilityValidator,
  type PlayabilityRule,
} from "../../game/validation/playability/playability-validator.js";

type FakeConfig = { value: number };

describe("createPlayabilityValidator", () => {
  it("is playable with no rules", () => {
    const validator = createPlayabilityValidator<FakeConfig>([]);

    expect(validator.validate({ value: 1 })).toEqual({
      playable: true,
      issues: [],
    });
  });

  it("ignores rules that return null", () => {
    const alwaysNull: PlayabilityRule<FakeConfig> = () => null;
    const validator = createPlayabilityValidator([alwaysNull]);

    expect(validator.validate({ value: 1 })).toEqual({
      playable: true,
      issues: [],
    });
  });

  it("stays playable when a rule raises a warning", () => {
    const warningRule: PlayabilityRule<FakeConfig> = () => ({
      severity: "warning",
      code: "SOME_WARNING",
      message: "just a warning",
    });
    const validator = createPlayabilityValidator([warningRule]);

    const report = validator.validate({ value: 1 });

    expect(report.playable).toBe(true);
    expect(report.issues).toEqual([
      { severity: "warning", code: "SOME_WARNING", message: "just a warning" },
    ]);
  });

  it("becomes unplayable when a rule raises an error", () => {
    const errorRule: PlayabilityRule<FakeConfig> = () => ({
      severity: "error",
      code: "SOME_ERROR",
      message: "blocking issue",
    });
    const validator = createPlayabilityValidator([errorRule]);

    const report = validator.validate({ value: 1 });

    expect(report.playable).toBe(false);
    expect(report.issues).toEqual([
      { severity: "error", code: "SOME_ERROR", message: "blocking issue" },
    ]);
  });

  it("aggregates issues from multiple rules", () => {
    const warningRule: PlayabilityRule<FakeConfig> = () => ({
      severity: "warning",
      code: "WARNING_CODE",
      message: "warning",
    });
    const errorRule: PlayabilityRule<FakeConfig> = () => ({
      severity: "error",
      code: "ERROR_CODE",
      message: "error",
    });
    const nullRule: PlayabilityRule<FakeConfig> = () => null;
    const validator = createPlayabilityValidator([
      warningRule,
      errorRule,
      nullRule,
    ]);

    const report = validator.validate({ value: 1 });

    expect(report.playable).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "WARNING_CODE",
      "ERROR_CODE",
    ]);
  });
});
