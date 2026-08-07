import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";
import {
  COLLECT_CANVAS_HEIGHT,
  COLLECT_CANVAS_WIDTH,
} from "../../templates/collect/collect-config.js";
import type { ValidationIssue } from "../types.js";
import type { PlayabilityRule } from "./playability-validator.js";

const SLOW_PLAYER_SPAWN_FACTOR = 4;
// Distance moyenne pour rejoindre un point tiré au hasard dans la zone de
// jeu : approximée par la moitié de la diagonale du canvas.
const HALF_DIAGONAL_PX =
  Math.hypot(COLLECT_CANVAS_WIDTH, COLLECT_CANVAS_HEIGHT) / 2;

/**
 * Vérifie que l'objectif reste atteignable compte tenu de la vitesse du
 * joueur : le temps moyen disponible par objet doit rester supérieur au
 * temps minimal nécessaire pour s'y déplacer.
 */
function checkTargetReachable(
  config: CollectGameConfig,
): ValidationIssue | null {
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
function checkSpawnPacing(config: CollectGameConfig): ValidationIssue | null {
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

export const collectPlayabilityRules: PlayabilityRule<CollectGameConfig>[] = [
  checkTargetReachable,
  checkSpawnPacing,
];
