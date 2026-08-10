import { describe, expect, it } from "vitest";
import { defaultShooterConfig } from "../../game/templates/shooter/shooter-config.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { shooterPlayabilityRules } from "../../game/validation/playability/shooter-playability-rules.js";

const shooterPlayabilityValidator = createPlayabilityValidator(
  shooterPlayabilityRules,
);

function issueCodes(
  report: ReturnType<typeof shooterPlayabilityValidator.validate>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("shooter playability rules", () => {
  it("a normal configuration is playable with no issues", () => {
    const report = shooterPlayabilityValidator.validate(defaultShooterConfig);

    expect(report).toEqual({ playable: true, issues: [] });
  });

  it("a borderline configuration stays playable but raises a warning", () => {
    // At most one enemy on screen at a time (slow spawn, fast fall), but the
    // fire cooldown only allows a shot every 1.5s against a 1.28s fall —
    // tight, but not impossible.
    const report = shooterPlayabilityValidator.validate({
      ...defaultShooterConfig,
      enemySpeed: 500,
      enemySpawnIntervalMs: 3000,
      fireCooldownMs: 1500,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toEqual(["EXCESSIVE_ENEMY_PRESSURE"]);
    expect(report.issues[0]?.severity).toBe("warning");
  });

  it("rejects a configuration where fire rate cannot match enemy pressure", () => {
    // Up to 13 enemies can be on screen at once, but the slowest cooldown
    // only allows ~3 shots during a single enemy's fall: structurally
    // impossible to keep up, without ever covering the whole screen width.
    const report = shooterPlayabilityValidator.validate({
      ...defaultShooterConfig,
      enemySpeed: 100,
      enemySpawnIntervalMs: 500,
      fireCooldownMs: 2000,
    });

    expect(report.playable).toBe(false);
    expect(issueCodes(report)).toEqual(["EXCESSIVE_ENEMY_PRESSURE"]);
    expect(report.issues[0]?.severity).toBe("error");
  });

  it("an impossible configuration is rejected", () => {
    // Slowest enemies with the fastest spawn rate: enemies cover the whole
    // width of the canvas continuously, no gap ever exists.
    const report = shooterPlayabilityValidator.validate({
      ...defaultShooterConfig,
      enemySpeed: 50,
      enemySpawnIntervalMs: 250,
    });

    expect(report.playable).toBe(false);
    expect(issueCodes(report)).toContain("ENEMIES_COVER_SCREEN");
    expect(
      report.issues.find((issue) => issue.code === "ENEMIES_COVER_SCREEN")
        ?.severity,
    ).toBe("error");
  });
});
