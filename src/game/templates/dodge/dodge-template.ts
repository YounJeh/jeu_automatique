import {
  dodgeGameConfigSchema,
  type DodgeGameConfig,
} from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { GameTemplateDefinition } from "../game-template-definition.js";
import {
  buildPlayabilityReport,
  type PlayabilityIssue,
  type PlayabilityReport,
} from "../playability.js";
import { createSemanticValidator } from "../../validation/semantic/semantic-validator.js";
import { dodgeSemanticRules } from "../../validation/semantic/dodge-semantic-rules.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_OBSTACLE_SIZE,
  defaultDodgeConfig,
} from "./dodge-config.js";
import { DodgeEngine } from "./dodge-engine.js";

const dodgeSemanticValidator = createSemanticValidator(dodgeSemanticRules);

const SHORT_DURATION_SECONDS = 15;
const LONG_DURATION_SECONDS = 100;
const SAFE_PRESSURE_RATIO = 1;
const CRITICAL_PRESSURE_RATIO = 0.5;

/**
 * Une configuration est manifestement impossible à éviter lorsque les
 * obstacles simultanément à l'écran peuvent occuper toute la largeur du
 * canvas : aucune position du joueur ne laisse alors de passage.
 */
function checkObstacleCoverage(
  config: DodgeGameConfig,
): PlayabilityIssue | null {
  const fallTimeMs = (DODGE_CANVAS_HEIGHT / config.obstacleSpeed) * 1000;
  const maxConcurrentObstacles = Math.ceil(
    fallTimeMs / config.obstacleSpawnIntervalMs,
  );

  if (maxConcurrentObstacles * DODGE_OBSTACLE_SIZE < DODGE_CANVAS_WIDTH) {
    return null;
  }

  return {
    severity: "error",
    code: "OBSTACLES_COVER_SCREEN",
    message:
      "Les obstacles peuvent occuper toute la largeur de l'écran en continu : l'évitement devient manifestement impossible.",
  };
}

/**
 * Combine vitesse des obstacles, fréquence d'apparition et vitesse du
 * joueur : compare la distance que le joueur peut parcourir entre deux
 * apparitions à l'écart moyen laissé entre les obstacles simultanés.
 */
function checkObstaclePressure(
  config: DodgeGameConfig,
): PlayabilityIssue | null {
  const fallTimeMs = (DODGE_CANVAS_HEIGHT / config.obstacleSpeed) * 1000;
  const maxConcurrentObstacles = Math.max(
    1,
    Math.ceil(fallTimeMs / config.obstacleSpawnIntervalMs),
  );
  const averageGapPx = DODGE_CANVAS_WIDTH / maxConcurrentObstacles;
  const playerReachPx =
    (config.playerSpeed * config.obstacleSpawnIntervalMs) / 1000;
  const ratio = playerReachPx / averageGapPx;

  if (ratio >= SAFE_PRESSURE_RATIO) {
    return null;
  }

  return {
    severity: ratio < CRITICAL_PRESSURE_RATIO ? "error" : "warning",
    code: "EXCESSIVE_OBSTACLE_PRESSURE",
    message:
      "La vitesse et la fréquence des obstacles laissent trop peu de temps au joueur pour se replacer avant l'apparition suivante.",
  };
}

function checkDuration(config: DodgeGameConfig): PlayabilityIssue | null {
  if (config.gameDurationSeconds <= SHORT_DURATION_SECONDS) {
    return {
      severity: "warning",
      code: "UNUSUAL_GAME_DURATION",
      message: "La durée de partie est anormalement courte.",
    };
  }

  if (config.gameDurationSeconds >= LONG_DURATION_SECONDS) {
    return {
      severity: "warning",
      code: "UNUSUAL_GAME_DURATION",
      message: "La durée de partie est anormalement longue.",
    };
  }

  return null;
}

function checkDodgePlayability(config: DodgeGameConfig): PlayabilityReport {
  const issues = [
    checkObstacleCoverage(config),
    checkObstaclePressure(config),
    checkDuration(config),
  ].filter((issue): issue is PlayabilityIssue => issue !== null);

  return buildPlayabilityReport(issues);
}

export const dodgeTemplateDefinition: GameTemplateDefinition<
  DodgeGameConfig,
  DodgeEngine
> = {
  id: "dodge",
  description:
    "Le joueur évite des obstacles qui descendent depuis le haut de l'écran.",
  defaultConfig: defaultDodgeConfig,
  configSchema: dodgeGameConfigSchema,
  createEngine: (config, random) => new DodgeEngine(config, random),
  checkSemantics: dodgeSemanticValidator.validate,
  checkPlayability: checkDodgePlayability,
};
