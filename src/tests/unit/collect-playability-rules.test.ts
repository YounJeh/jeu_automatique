import { describe, expect, it } from "vitest";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import { collectPlayabilityRules } from "../../game/validation/playability/collect-playability-rules.js";

const collectPlayabilityValidator = createPlayabilityValidator(
  collectPlayabilityRules,
);

function issueCodes(
  report: ReturnType<typeof collectPlayabilityValidator.validate>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("collect playability rules", () => {
  it("a normal configuration is playable with no issues", () => {
    const report = collectPlayabilityValidator.validate(defaultCollectConfig);

    expect(report).toEqual({ playable: true, issues: [] });
  });

  it("an impossible configuration is rejected", () => {
    // Maximum target with the slowest player: the average time budget per
    // item is far below the minimal travel time.
    const report = collectPlayabilityValidator.validate({
      ...defaultCollectConfig,
      targetCollectibleCount: 50,
      gameDurationSeconds: 10,
      playerSpeed: 100,
    });

    expect(report.playable).toBe(false);
    expect(issueCodes(report)).toContain("TARGET_UNREACHABLE_FOR_PLAYER_SPEED");
    expect(
      report.issues.find(
        (issue) => issue.code === "TARGET_UNREACHABLE_FOR_PLAYER_SPEED",
      )?.severity,
    ).toBe("error");
  });

  it("warns when the player is much slower than the spawn rate", () => {
    const report = collectPlayabilityValidator.validate({
      ...defaultCollectConfig,
      playerSpeed: 150,
      collectibleSpawnIntervalMs: 250,
      targetCollectibleCount: 5,
      gameDurationSeconds: 30,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toEqual(["SLOW_PLAYER_VS_SPAWN_RATE"]);
  });
});
