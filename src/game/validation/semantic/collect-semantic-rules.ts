import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";
import type { ValidationIssue } from "../types.js";
import type { SemanticRule } from "./semantic-validator.js";

const TIGHT_WINDOW_RATIO = 0.9;
const TRIVIAL_TARGET_THRESHOLD = 3;
const TRIVIAL_SPAWN_RATIO = 0.3;

/**
 * Vérifie que suffisamment d'objets peuvent apparaître avant la fin du
 * temps imparti pour espérer atteindre l'objectif ; avertit lorsque la
 * marge devient très faible. Arithmétique pure sur count/interval/durée,
 * sans géométrie ni vitesse du joueur (réservées à la couche playability).
 */
function checkSpawnBudget(config: CollectGameConfig): ValidationIssue | null {
  const durationMs = config.gameDurationSeconds * 1000;
  const timeToSpawnAllMs =
    config.targetCollectibleCount * config.collectibleSpawnIntervalMs;

  if (timeToSpawnAllMs > durationMs) {
    return {
      severity: "error",
      code: "INSUFFICIENT_SPAWN_TIME",
      message:
        "Le nombre d'objets à collecter ne peut pas apparaître avant la fin du temps imparti.",
    };
  }

  if (timeToSpawnAllMs > durationMs * TIGHT_WINDOW_RATIO) {
    return {
      severity: "warning",
      code: "TIGHT_COLLECTION_WINDOW",
      message:
        "Les derniers objets apparaissent juste avant la fin du temps imparti, laissant très peu de marge pour les atteindre.",
    };
  }

  return null;
}

/**
 * Signale un objectif trivial : peu d'objets à collecter, tous disponibles
 * très tôt par rapport à la durée totale de la partie.
 */
function checkObjectiveTrivial(
  config: CollectGameConfig,
): ValidationIssue | null {
  const durationMs = config.gameDurationSeconds * 1000;
  const timeToSpawnAllMs =
    config.targetCollectibleCount * config.collectibleSpawnIntervalMs;

  if (
    config.targetCollectibleCount > TRIVIAL_TARGET_THRESHOLD ||
    timeToSpawnAllMs > durationMs * TRIVIAL_SPAWN_RATIO
  ) {
    return null;
  }

  return {
    severity: "warning",
    code: "TRIVIAL_OBJECTIVE",
    message:
      "L'objectif est atteint très tôt par rapport à la durée de la partie : le défi est trivial.",
  };
}

export const collectSemanticRules: SemanticRule<CollectGameConfig>[] = [
  checkSpawnBudget,
  checkObjectiveTrivial,
];
