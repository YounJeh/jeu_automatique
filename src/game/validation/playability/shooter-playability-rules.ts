import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";
import {
  SHOOTER_CANVAS_HEIGHT,
  SHOOTER_CANVAS_WIDTH,
  SHOOTER_ENEMY_SIZE,
} from "../../templates/shooter/shooter-config.js";
import type { ValidationIssue } from "../types.js";
import type { PlayabilityRule } from "./playability-validator.js";

const SAFE_PRESSURE_RATIO = 1;
const CRITICAL_PRESSURE_RATIO = 0.5;

/**
 * Une configuration est manifestement injouable lorsque les ennemis
 * simultanément à l'écran peuvent occuper toute la largeur du canvas :
 * aucune position du joueur ne laisse alors d'échappatoire.
 */
function checkEnemyCoverage(config: ShooterGameConfig): ValidationIssue | null {
  const fallTimeMs = (SHOOTER_CANVAS_HEIGHT / config.enemySpeed) * 1000;
  const maxConcurrentEnemies = Math.ceil(
    fallTimeMs / config.enemySpawnIntervalMs,
  );

  if (maxConcurrentEnemies * SHOOTER_ENEMY_SIZE < SHOOTER_CANVAS_WIDTH) {
    return null;
  }

  return {
    severity: "error",
    code: "ENEMIES_COVER_SCREEN",
    message:
      "Les ennemis peuvent occuper toute la largeur de l'écran en continu : aucune échappatoire n'est possible.",
  };
}

/**
 * Compare la cadence de tir du joueur (nombre de tirs possibles pendant le
 * temps de traversée d'un ennemi) au nombre d'ennemis simultanément
 * présents à l'écran : si le joueur ne peut structurellement pas détruire
 * les ennemis aussi vite qu'ils apparaissent, la pression devient
 * intenable.
 */
function checkEnemyPressure(config: ShooterGameConfig): ValidationIssue | null {
  const fallTimeMs = (SHOOTER_CANVAS_HEIGHT / config.enemySpeed) * 1000;
  const maxConcurrentEnemies = Math.max(
    1,
    Math.ceil(fallTimeMs / config.enemySpawnIntervalMs),
  );
  const maxShotsDuringFall = fallTimeMs / config.fireCooldownMs;
  const ratio = maxShotsDuringFall / maxConcurrentEnemies;

  if (ratio >= SAFE_PRESSURE_RATIO) {
    return null;
  }

  return {
    severity: ratio < CRITICAL_PRESSURE_RATIO ? "error" : "warning",
    code: "EXCESSIVE_ENEMY_PRESSURE",
    message:
      "La vitesse et la fréquence des ennemis dépassent la cadence de tir du joueur : il ne peut structurellement pas les détruire aussi vite qu'ils apparaissent.",
  };
}

export const shooterPlayabilityRules: PlayabilityRule<ShooterGameConfig>[] = [
  checkEnemyCoverage,
  checkEnemyPressure,
];
