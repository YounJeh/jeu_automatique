import { describe, expect, it } from "vitest";
import { dodgeTemplateDefinition } from "../../game/templates/dodge/dodge-template.js";
import { collectTemplateDefinition } from "../../game/templates/collect/collect-template.js";

function issueCodes(
  report: ReturnType<typeof dodgeTemplateDefinition.checkPlayability>,
): string[] {
  return report.issues.map((issue) => issue.code);
}

describe("dodge playability", () => {
  it("a normal configuration is playable with no issues", () => {
    const report = dodgeTemplateDefinition.checkPlayability(
      dodgeTemplateDefinition.defaultConfig,
    );

    expect(report).toEqual({ playable: true, issues: [] });
  });

  it("a borderline configuration stays playable but raises a warning", () => {
    // Only one obstacle can be on screen at a time (slow spawn, fast fall),
    // and the player is slow enough that it can't always reach the far
    // side of the gap between two spawns — tight, but not impossible.
    const report = dodgeTemplateDefinition.checkPlayability({
      ...dodgeTemplateDefinition.defaultConfig,
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
    const report = dodgeTemplateDefinition.checkPlayability({
      ...dodgeTemplateDefinition.defaultConfig,
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

  it("warns about an anormally short game duration without blocking it", () => {
    const report = dodgeTemplateDefinition.checkPlayability({
      ...dodgeTemplateDefinition.defaultConfig,
      gameDurationSeconds: 10,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toContain("UNUSUAL_GAME_DURATION");
  });

  it("warns about an anormally long game duration without blocking it", () => {
    const report = dodgeTemplateDefinition.checkPlayability({
      ...dodgeTemplateDefinition.defaultConfig,
      gameDurationSeconds: 120,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toContain("UNUSUAL_GAME_DURATION");
  });
});

describe("collect playability", () => {
  it("a normal configuration is playable with no issues", () => {
    const report = collectTemplateDefinition.checkPlayability(
      collectTemplateDefinition.defaultConfig,
    );

    expect(report).toEqual({ playable: true, issues: [] });
  });

  it("a borderline configuration stays playable but raises a warning", () => {
    // The last collectible spawns at 15s, right before the 16s time limit:
    // technically reachable, but with almost no margin.
    const report = collectTemplateDefinition.checkPlayability({
      ...collectTemplateDefinition.defaultConfig,
      targetCollectibleCount: 15,
      collectibleSpawnIntervalMs: 1000,
      gameDurationSeconds: 16,
      playerSpeed: 600,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toEqual(["TIGHT_COLLECTION_WINDOW"]);
    expect(report.issues[0]?.severity).toBe("warning");
  });

  it("an impossible configuration is rejected", () => {
    // Maximum target with the slowest spawn rate and shortest duration:
    // far more objects need to spawn than the time allows.
    const report = collectTemplateDefinition.checkPlayability({
      ...collectTemplateDefinition.defaultConfig,
      targetCollectibleCount: 50,
      collectibleSpawnIntervalMs: 5000,
      gameDurationSeconds: 10,
      playerSpeed: 100,
    });

    expect(report.playable).toBe(false);
    expect(issueCodes(report)).toContain("INSUFFICIENT_SPAWN_TIME");
    expect(issueCodes(report)).toContain("TARGET_UNREACHABLE_FOR_PLAYER_SPEED");
  });

  it("warns when the player is much slower than the spawn rate", () => {
    const report = collectTemplateDefinition.checkPlayability({
      ...collectTemplateDefinition.defaultConfig,
      playerSpeed: 150,
      collectibleSpawnIntervalMs: 250,
      targetCollectibleCount: 5,
      gameDurationSeconds: 30,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toEqual(["SLOW_PLAYER_VS_SPAWN_RATE"]);
  });

  it("warns about a trivial objective without blocking it", () => {
    const report = collectTemplateDefinition.checkPlayability({
      ...collectTemplateDefinition.defaultConfig,
      targetCollectibleCount: 3,
      collectibleSpawnIntervalMs: 250,
      gameDurationSeconds: 120,
    });

    expect(report.playable).toBe(true);
    expect(issueCodes(report)).toContain("TRIVIAL_OBJECTIVE");
  });
});
