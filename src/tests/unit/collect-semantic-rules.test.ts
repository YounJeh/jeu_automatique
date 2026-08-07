import { describe, expect, it } from "vitest";
import { defaultCollectConfig } from "../../game/templates/collect/collect-config.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { collectSemanticRules } from "../../game/validation/semantic/collect-semantic-rules.js";

const collectSemanticValidator = createSemanticValidator(collectSemanticRules);

function issueCodes(
  report: ReturnType<typeof collectSemanticValidator.validate>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("collect semantic rules", () => {
  it("a normal configuration is valid with no issues", () => {
    const report = collectSemanticValidator.validate(defaultCollectConfig);

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("a borderline configuration stays valid but raises a warning", () => {
    // The last collectible spawns at 15s, right before the 16s time limit:
    // technically reachable, but with almost no margin.
    const report = collectSemanticValidator.validate({
      ...defaultCollectConfig,
      targetCollectibleCount: 15,
      collectibleSpawnIntervalMs: 1000,
      gameDurationSeconds: 16,
    });

    expect(report.valid).toBe(true);
    expect(issueCodes(report)).toEqual(["TIGHT_COLLECTION_WINDOW"]);
    expect(report.issues[0]?.severity).toBe("warning");
  });

  it("an impossible configuration is rejected", () => {
    // Far more objects need to spawn than the time allows.
    const report = collectSemanticValidator.validate({
      ...defaultCollectConfig,
      targetCollectibleCount: 50,
      collectibleSpawnIntervalMs: 5000,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(false);
    expect(issueCodes(report)).toContain("INSUFFICIENT_SPAWN_TIME");
    expect(
      report.issues.find((issue) => issue.code === "INSUFFICIENT_SPAWN_TIME")
        ?.severity,
    ).toBe("error");
  });

  it("warns about a trivial objective without blocking it", () => {
    const report = collectSemanticValidator.validate({
      ...defaultCollectConfig,
      targetCollectibleCount: 3,
      collectibleSpawnIntervalMs: 250,
      gameDurationSeconds: 120,
    });

    expect(report.valid).toBe(true);
    expect(issueCodes(report)).toContain("TRIVIAL_OBJECTIVE");
  });
});
