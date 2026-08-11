import { describe, expect, it } from "vitest";
import {
  inferGameDefinition,
  type GenerateGameDefinition,
} from "../../mastra/workflows/infer-game-definition-step.js";
import { GameGenerationError } from "../../mastra/errors/game-generation-error.js";
import { dodgeGameDefinitionExample } from "../../game/definition/examples/dodge-game-definition.js";
import { collectGameDefinitionExample } from "../../game/definition/examples/collect-game-definition.js";
import { shooterPreset } from "../../game/presets/shooter.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";

const INVALID_DEFINITION: GameDefinition = {
  ...dodgeGameDefinitionExample,
  // Fails checkPlayerFitsWorld (PHASE 5 playability): the player can't
  // possibly fit in a 1px-tall world.
  world: { ...dodgeGameDefinitionExample.world, height: 1 },
};

function generatorSequence(
  ...results: (GameDefinition | undefined)[]
): GenerateGameDefinition {
  let call = 0;
  return async () => {
    const result = results[call];
    call += 1;
    return result;
  };
}

describe("inferGameDefinition", () => {
  it("returns the first attempt directly when it's already valid", async () => {
    const generate = generatorSequence(collectGameDefinitionExample);

    const result = await inferGameDefinition("un jeu de collecte", generate);

    expect(result).toEqual({
      definition: collectGameDefinitionExample,
      template: "collect",
      repaired: false,
      usedFallbackPreset: false,
    });
  });

  it("repairs once and succeeds on the second attempt", async () => {
    const generate = generatorSequence(
      INVALID_DEFINITION,
      dodgeGameDefinitionExample,
    );

    const result = await inferGameDefinition("un jeu d'évitement", generate);

    expect(result).toEqual({
      definition: dodgeGameDefinitionExample,
      template: "dodge",
      repaired: true,
      usedFallbackPreset: false,
    });
  });

  it("falls back to the closest capable preset after 2 failures, never inventing a definition", async () => {
    const generate = generatorSequence(INVALID_DEFINITION, INVALID_DEFINITION);

    const result = await inferGameDefinition("un jeu quelconque", generate);

    expect(result.usedFallbackPreset).toBe(true);
    expect(result.repaired).toBe(false);
    expect([
      dodgeGameDefinitionExample,
      collectGameDefinitionExample,
    ]).toContainEqual(result.definition);
  });

  it("never falls back to a preset that declares shoot (not GenericRuntime-capable)", async () => {
    // Both attempts fail; the raw (invalid) mechanics happen to overlap
    // most with shooter's own mechanic set, which must NOT be selected as
    // the fallback since it has no legacy config to catch it either.
    const almostShooter: GameDefinition = {
      ...INVALID_DEFINITION,
      mechanics: shooterPreset.definition.mechanics,
    };
    const generate = generatorSequence(almostShooter, almostShooter);

    const result = await inferGameDefinition("un jeu de tir", generate);

    expect(result.usedFallbackPreset).toBe(true);
    expect(result.template).not.toBe("shooter");
  });

  it("throws MODEL_UNAVAILABLE when the first attempt produces nothing, without repairing", async () => {
    let calls = 0;
    const generate: GenerateGameDefinition = async () => {
      calls += 1;
      return undefined;
    };

    await expect(inferGameDefinition("un jeu", generate)).rejects.toMatchObject(
      { code: "MODEL_UNAVAILABLE" },
    );
    expect(calls).toBe(1);

    await expect(
      inferGameDefinition("un jeu", generate),
    ).rejects.toBeInstanceOf(GameGenerationError);
  });

  it("falls back when the repair attempt itself produces nothing", async () => {
    const generate = generatorSequence(INVALID_DEFINITION, undefined);

    const result = await inferGameDefinition("un jeu", generate);

    expect(result.usedFallbackPreset).toBe(true);
    expect(result.repaired).toBe(false);
  });
});
