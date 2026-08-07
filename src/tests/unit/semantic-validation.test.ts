import { describe, expect, it } from "vitest";
import { dodgeTemplateDefinition } from "../../game/templates/dodge/dodge-template.js";
import { collectTemplateDefinition } from "../../game/templates/collect/collect-template.js";

/**
 * Smoke tests de câblage : vérifient que `checkSemantics` sur chaque
 * template délègue bien à ses règles. L'exhaustivité des cas limites est
 * couverte par dodge-semantic-rules.test.ts et collect-semantic-rules.test.ts.
 */
describe("checkSemantics wiring", () => {
  it("dodge: the default configuration is valid with no issues", () => {
    const report = dodgeTemplateDefinition.checkSemantics(
      dodgeTemplateDefinition.defaultConfig,
    );

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("dodge: delegates to dodgeSemanticRules for an anormal duration", () => {
    const report = dodgeTemplateDefinition.checkSemantics({
      ...dodgeTemplateDefinition.defaultConfig,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual([
      "UNUSUAL_GAME_DURATION",
    ]);
  });

  it("collect: the default configuration is valid with no issues", () => {
    const report = collectTemplateDefinition.checkSemantics(
      collectTemplateDefinition.defaultConfig,
    );

    expect(report).toEqual({ valid: true, issues: [] });
  });

  it("collect: delegates to collectSemanticRules for an unreachable spawn budget", () => {
    const report = collectTemplateDefinition.checkSemantics({
      ...collectTemplateDefinition.defaultConfig,
      targetCollectibleCount: 50,
      collectibleSpawnIntervalMs: 5000,
      gameDurationSeconds: 10,
    });

    expect(report.valid).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain(
      "INSUFFICIENT_SPAWN_TIME",
    );
  });
});
