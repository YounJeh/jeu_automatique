import { describe, expect, it } from "vitest";
import { defaultDodgeConfig } from "../../game/templates/dodge/dodge-config.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { dodgePlayabilityRules } from "../../game/validation/playability/dodge-playability-rules.js";

const dodgePlayabilityValidator = createPlayabilityValidator(
  dodgePlayabilityRules,
);

function issueCodes(
  report: ReturnType<typeof dodgePlayabilityValidator.validate>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("dodge playability rules", () => {
  it("a normal configuration is playable with no issues", () => {
    const report = dodgePlayabilityValidator.validate(defaultDodgeConfig);

    expect(report).toEqual({ playable: true, issues: [] });
  });

  it("a borderline configuration stays playable but raises a warning", () => {
    // Only one obstacle can be on screen at a time (slow spawn, fast fall),
    // and the player is slow enough that it can't always reach the far
    // side of the gap between two spawns — tight, but not impossible.
    const report = dodgePlayabilityValidator.validate({
      ...defaultDodgeConfig,
      obstacleSpeed: 500,
      obstacleSpawnIntervalMs: 3000,
      playerSpeed: 100,
      gameDurationSeconds: 30,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toEqual(["EXCESSIVE_OBSTACLE_PRESSURE"]);
    expect(report.issues[0]?.severity).toBe("warning");
  });

  it("an impossible configuration is rejected", () => {
    // Slowest obstacles with the fastest spawn rate: obstacles cover the
    // whole width of the canvas continuously, no gap ever exists.
    const report = dodgePlayabilityValidator.validate({
      ...defaultDodgeConfig,
      obstacleSpeed: 50,
      obstacleSpawnIntervalMs: 250,
    });

    expect(report.playable).toBe(false);
    expect(issueCodes(report)).toContain("OBSTACLES_COVER_SCREEN");
    expect(
      report.issues.find((issue) => issue.code === "OBSTACLES_COVER_SCREEN")
        ?.severity,
    ).toBe("error");
  });
});
