import {
  collectGameConfigSchema,
  type CollectGameConfig,
} from "../../../mastra/schemas/collect-game-config-schema.js";
import type { GameTemplateDefinition } from "../game-template-definition.js";
import {
  buildPlayabilityReport,
  type PlayabilityIssue,
  type PlayabilityReport,
} from "../playability.js";
import {
  COLLECT_CANVAS_HEIGHT,
  COLLECT_CANVAS_WIDTH,
  defaultCollectConfig,
} from "./collect-config.js";
import { CollectEngine } from "./collect-engine.js";

const TIGHT_WINDOW_RATIO = 0.9;
const SLOW_PLAYER_SPAWN_FACTOR = 4;
const TRIVIAL_TARGET_THRESHOLD = 3;
const TRIVIAL_SPAWN_RATIO = 0.3;
// Distance moyenne pour rejoindre un point tiré au hasard dans la zone de
// jeu : approximée par la moitié de la diagonale du canvas.
const HALF_DIAGONAL_PX =
  Math.hypot(COLLECT_CANVAS_WIDTH, COLLECT_CANVAS_HEIGHT) / 2;

/**
 * Vérifie que suffisamment d'objets peuvent apparaître avant la fin du
 * temps imparti pour espérer atteindre l'objectif ; avertit lorsque la
 * marge devient très faible.
 */
function checkSpawnBudget(config: CollectGameConfig): PlayabilityIssue | null {
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
 * Vérifie que l'objectif reste atteignable compte tenu de la vitesse du
 * joueur : le temps moyen disponible par objet doit rester supérieur au
 * temps minimal nécessaire pour s'y déplacer.
 */
function checkTargetReachable(
  config: CollectGameConfig,
): PlayabilityIssue | null {
  const durationMs = config.gameDurationSeconds * 1000;
  const avgTimeBudgetPerItemMs = durationMs / config.targetCollectibleCount;
  const minTravelTimeMs = (HALF_DIAGONAL_PX / config.playerSpeed) * 1000;

  if (avgTimeBudgetPerItemMs >= minTravelTimeMs) {
    return null;
  }

  return {
    severity: "error",
    code: "TARGET_UNREACHABLE_FOR_PLAYER_SPEED",
    message:
      "Le temps disponible par objet est inférieur au temps de déplacement minimal du joueur : l'objectif est manifestement inatteignable.",
  };
}

/**
 * Vérifie que la vitesse du joueur reste cohérente avec la fréquence
 * d'apparition : un joueur trop lent par rapport au rythme d'apparition
 * rend le jeu incohérent sans le rendre impossible (les objets n'expirent
 * pas).
 */
function checkSpawnPacing(config: CollectGameConfig): PlayabilityIssue | null {
  const crossTimeMs = (COLLECT_CANVAS_WIDTH / config.playerSpeed) * 1000;

  if (
    crossTimeMs <=
    config.collectibleSpawnIntervalMs * SLOW_PLAYER_SPAWN_FACTOR
  ) {
    return null;
  }

  return {
    severity: "warning",
    code: "SLOW_PLAYER_VS_SPAWN_RATE",
    message:
      "Le joueur est nettement plus lent que le rythme d'apparition des objets : le rythme du jeu risque d'être incohérent.",
  };
}

/**
 * Signale un objectif trivial : peu d'objets à collecter, tous disponibles
 * très tôt par rapport à la durée totale de la partie.
 */
function checkObjectiveTrivial(
  config: CollectGameConfig,
): PlayabilityIssue | null {
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

function checkCollectPlayability(config: CollectGameConfig): PlayabilityReport {
  const issues = [
    checkSpawnBudget(config),
    checkTargetReachable(config),
    checkSpawnPacing(config),
    checkObjectiveTrivial(config),
  ].filter((issue): issue is PlayabilityIssue => issue !== null);

  return buildPlayabilityReport(issues);
}

export const collectTemplateDefinition: GameTemplateDefinition<
  CollectGameConfig,
  CollectEngine
> = {
  id: "collect",
  description:
    "Le joueur collecte un nombre d'objets donné avant la fin du temps imparti.",
  defaultConfig: defaultCollectConfig,
  configSchema: collectGameConfigSchema,
  createEngine: (config, random) => new CollectEngine(config, random),
  checkPlayability: checkCollectPlayability,
};
