import { describe, expect, it } from "vitest";
import { defaultShooterConfig } from "../../game/templates/shooter/shooter-config.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { shooterSemanticRules } from "../../game/validation/semantic/shooter-semantic-rules.js";

const shooterSemanticValidator = createSemanticValidator(shooterSemanticRules);

function issueCodes(
  report: ReturnType<typeof shooterSemanticValidator.validate>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("shooter semantic rules", () => {
  it("a normal configuration is valid with no issues", () => {
    const report = shooterSemanticValidator.validate(defaultShooterConfig);

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("warns about an anormally short game duration without blocking it", () => {
    const report = shooterSemanticValidator.validate({
      ...defaultShooterConfig,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(true);
    expect(issueCodes(report)).toEqual(["UNUSUAL_GAME_DURATION"]);
  });

  it("warns about an anormally long game duration without blocking it", () => {
    const report = shooterSemanticValidator.validate({
      ...defaultShooterConfig,
      gameDurationSeconds: 120,
    });

    expect(report.valid).toBe(true);
    expect(issueCodes(report)).toEqual(["UNUSUAL_GAME_DURATION"]);
  });

  it("warns about a tight fire window without blocking it", () => {
    // 50 kills * 550ms cooldown = 27 500ms, just under the 30s time limit:
    // technically reachable while firing almost without interruption.
    const report = shooterSemanticValidator.validate({
      ...defaultShooterConfig,
      targetKillCount: 50,
      fireCooldownMs: 550,
      gameDurationSeconds: 30,
    });

    expect(report.valid).toBe(true);
    expect(issueCodes(report)).toEqual(["TIGHT_FIRE_WINDOW"]);
  });

  it("rejects a configuration where the objective is arithmetically unreachable", () => {
    // Even firing non-stop, 50 kills * 2000ms cooldown (100s) vastly
    // exceeds the 10s time limit.
    const report = shooterSemanticValidator.validate({
      ...defaultShooterConfig,
      targetKillCount: 50,
      fireCooldownMs: 2000,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(false);
    expect(issueCodes(report)).toContain("INSUFFICIENT_FIRE_TIME");
    expect(
      report.issues.find((issue) => issue.code === "INSUFFICIENT_FIRE_TIME")
        ?.severity,
    ).toBe("error");
  });
});
