import { describe, expect, it } from "vitest";
import { dodgeTemplateDefinition } from "../../game/templates/dodge/dodge-template.js";
import { collectTemplateDefinition } from "../../game/templates/collect/collect-template.js";
import { GameGenerationError } from "../../mastra/errors/game-generation-error.js";
import { validateGameConfig } from "../../mastra/workflows/generate-game-workflow.js";

describe("validateGameConfig", () => {
  it("rejects a configuration that fails only semantic validation", () => {
    // targetCollectibleCount * collectibleSpawnIntervalMs (250 000ms) is far
    // beyond gameDurationSeconds (10 000ms): INSUFFICIENT_SPAWN_TIME, purely
    // arithmetic, no geometry involved — checkPlayability alone would not
    // have caught this before task 9/10 reclassified it as semantic.
    const candidate = {
      ...collectTemplateDefinition.defaultConfig,
      targetCollectibleCount: 50,
      collectibleSpawnIntervalMs: 5000,
      gameDurationSeconds: 10,
    };

    expect(() =>
      validateGameConfig(collectTemplateDefinition, candidate),
    ).toThrow(GameGenerationError);

    try {
      validateGameConfig(collectTemplateDefinition, candidate);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GameGenerationError);
      expect((error as GameGenerationError).code).toBe(
        "SEMANTIC_VALIDATION_FAILED",
      );
      expect((error as GameGenerationError).message).toBe(
        "Le nombre d'objets à collecter ne peut pas apparaître avant la fin du temps imparti.",
      );
    }
  });

  it("rejects a configuration that fails only playability validation", () => {
    // Slowest obstacles with the fastest spawn rate: OBSTACLES_COVER_SCREEN.
    // Semantically fine (gameDurationSeconds is untouched, still 30s).
    const candidate = {
      ...dodgeTemplateDefinition.defaultConfig,
      obstacleSpeed: 50,
      obstacleSpawnIntervalMs: 250,
    };

    expect(() =>
      validateGameConfig(dodgeTemplateDefinition, candidate),
    ).toThrow(GameGenerationError);

    try {
      validateGameConfig(dodgeTemplateDefinition, candidate);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GameGenerationError);
      expect((error as GameGenerationError).code).toBe(
        "PLAYABILITY_VALIDATION_FAILED",
      );
      expect((error as GameGenerationError).message).toBe(
        "Les obstacles peuvent occuper toute la largeur de l'écran en continu : l'évitement devient manifestement impossible.",
      );
    }
  });

  it("accepts a configuration valid on both layers", () => {
    expect(
      validateGameConfig(
        dodgeTemplateDefinition,
        dodgeTemplateDefinition.defaultConfig,
      ),
    ).toEqual(dodgeTemplateDefinition.defaultConfig);

    expect(
      validateGameConfig(
        collectTemplateDefinition,
        collectTemplateDefinition.defaultConfig,
      ),
    ).toEqual(collectTemplateDefinition.defaultConfig);
  });
});
