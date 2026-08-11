import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { gameDefinitionSchema } from "../../game/definition/game-definition-schema.js";
import type { GameDefinition } from "../../game/definition/game-definition-schema.js";
import { gameDefinitionSemanticRules } from "../../game/definition/game-definition-semantic-rules.js";
import { gameDefinitionPlayabilityRules } from "../../game/definition/game-definition-playability-rules.js";
import { createSemanticValidator } from "../../game/validation/semantic/semantic-validator.js";
import { createPlayabilityValidator } from "../../game/validation/playability/playability-validator.js";
import {
  GAME_MECHANICS,
  type GameMechanic,
} from "../../game/mechanics/registry.js";
import { listGamePresets } from "../../game/presets/registry.js";
import type { GamePreset } from "../../game/presets/game-preset.js";
import { isGenericRuntimeCapable } from "../../game/core/runtime/generic-runtime-capability.js";
import { GAME_TEMPLATES } from "../../game/types/game-template.js";
import type { GameTemplate } from "../../game/types/game-template.js";
import { GameGenerationError } from "../errors/game-generation-error.js";

export type InferGameDefinitionResult = {
  definition: GameDefinition;
  template: GameTemplate;
  repaired: boolean;
  usedFallbackPreset: boolean;
};

// Kept minimal on purpose: inferGameDefinition() only needs "a prompt in,
// a GameDefinition (or nothing) out" to be testable without mocking the
// full Mastra Agent shape.
export type GenerateGameDefinition = (
  prompt: string,
) => Promise<GameDefinition | undefined>;

function buildInferencePrompt(prompt: string): string {
  const mechanicsList = GAME_MECHANICS.join(", ");
  const presetExamples = listGamePresets()
    .map(
      (preset) =>
        `- "${preset.template}" : ${JSON.stringify(preset.definition)}`,
    )
    .join("\n");

  return (
    `Mécaniques disponibles : ${mechanicsList}\n\n` +
    `Exemples de GameDefinition valides :\n${presetExamples}\n\n` +
    `Demande de l'utilisateur : "${prompt}"\n\n` +
    `Produis une GameDefinition complète et cohérente avec cette demande.`
  );
}

function buildRepairPrompt(prompt: string, errorMessage: string): string {
  return (
    `${buildInferencePrompt(prompt)}\n\n` +
    `Ta précédente tentative était invalide : ${errorMessage}\n` +
    `Corrige ce problème et produis une nouvelle GameDefinition complète.`
  );
}

/** Retourne un message d'erreur si la définition échoue la validation
 * sémantique ou de jouabilité (PHASE 5), null sinon. Le schéma lui-même
 * est déjà garanti par structuredOutput avant d'atteindre cette fonction. */
function firstValidationError(definition: GameDefinition): string | null {
  const semanticReport = createSemanticValidator(
    gameDefinitionSemanticRules,
  ).validate(definition);
  if (!semanticReport.valid) {
    return (
      semanticReport.issues.find((issue) => issue.severity === "error")
        ?.message ?? "Définition sémantiquement invalide."
    );
  }

  const playabilityReport = createPlayabilityValidator(
    gameDefinitionPlayabilityRules,
  ).validate(definition);
  if (!playabilityReport.playable) {
    return (
      playabilityReport.issues.find((issue) => issue.severity === "error")
        ?.message ?? "Définition non jouable."
    );
  }

  return null;
}

function overlapScore(
  a: readonly GameMechanic[],
  b: readonly GameMechanic[],
): number {
  const bSet = new Set(b);
  return a.filter((mechanic) => bSet.has(mechanic)).length;
}

/** Preset dont les mécaniques recoupent le plus `mechanics` (égalité
 * tranchée par l'ordre de `candidates`, jamais indéterminé). `candidates`
 * doit être non vide. */
function bestMatchingPreset(
  mechanics: readonly GameMechanic[],
  candidates: readonly GamePreset[],
): GamePreset {
  let best = candidates[0]!;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = overlapScore(mechanics, candidate.definition.mechanics);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Prompt -> GameDefinition validée, avec au maximum une réparation
 * structurée (CLAUDE.md §22.5) puis un repli déterministe sur le preset le
 * plus proche par recouvrement de mécaniques. Le repli est restreint aux
 * presets exécutables par GenericRuntime (isGenericRuntimeCapable) : un
 * item issu de cette voie n'a pas de config legacy pour rattraper un
 * preset non exécutable (voir game-controller.ts).
 */
export async function inferGameDefinition(
  prompt: string,
  generate: GenerateGameDefinition,
): Promise<InferGameDefinitionResult> {
  const first = await generate(buildInferencePrompt(prompt));

  if (!first) {
    throw new GameGenerationError(
      "MODEL_UNAVAILABLE",
      "Le modèle n'a pas produit de définition de jeu exploitable.",
    );
  }

  const firstError = firstValidationError(first);
  if (!firstError) {
    return {
      definition: first,
      template: bestMatchingPreset(first.mechanics, listGamePresets()).template,
      repaired: false,
      usedFallbackPreset: false,
    };
  }

  const repaired = await generate(buildRepairPrompt(prompt, firstError));
  const repairedError = repaired ? firstValidationError(repaired) : null;

  if (repaired && !repairedError) {
    return {
      definition: repaired,
      template: bestMatchingPreset(repaired.mechanics, listGamePresets())
        .template,
      repaired: true,
      usedFallbackPreset: false,
    };
  }

  const fallbackCandidates = listGamePresets().filter((preset) =>
    isGenericRuntimeCapable(preset.definition),
  );
  const mechanicsForScoring = repaired?.mechanics ?? first.mechanics;
  const fallback = bestMatchingPreset(mechanicsForScoring, fallbackCandidates);

  return {
    definition: fallback.definition,
    template: fallback.template,
    repaired: false,
    usedFallbackPreset: true,
  };
}

export const inferGameDefinitionStep = createStep({
  id: "infer-game-definition",
  description:
    "Infère les mécaniques d'une demande et produit une GameDefinition validée (schéma, sémantique, jouabilité), avec une réparation possible et un repli sur preset.",
  inputSchema: z.object({ prompt: z.string() }),
  outputSchema: z.object({
    definition: gameDefinitionSchema,
    template: z.enum(GAME_TEMPLATES),
    repaired: z.boolean(),
    usedFallbackPreset: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent("gameDesignerAgent");

    return inferGameDefinition(inputData.prompt, async (generationPrompt) => {
      const response = await agent.generate(generationPrompt, {
        structuredOutput: { schema: gameDefinitionSchema },
      });
      return response.object;
    });
  },
});
