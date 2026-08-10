import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";
import type { ValidationIssue } from "../types.js";
import type { SemanticRule } from "./semantic-validator.js";

const SHORT_DURATION_SECONDS = 15;
const LONG_DURATION_SECONDS = 100;

/**
 * Signale une durée de partie anormalement courte ou longue : borne relative
 * sur un seul champ déclaré, sans géométrie ni notion de temps de réaction
 * du joueur (réservées à la couche playability).
 */
function checkDuration(config: ShooterGameConfig): ValidationIssue | null {
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

const TIGHT_WINDOW_RATIO = 0.9;

/**
 * Vérifie que suffisamment de tirs peuvent être déclenchés avant la fin du
 * temps imparti pour espérer atteindre targetKillCount ; avertit lorsque la
 * marge devient très faible. Arithmétique pure sur count/cooldown/durée,
 * sans géométrie ni vitesse des ennemis (réservées à la couche playability).
 */
function checkFireBudget(config: ShooterGameConfig): ValidationIssue | null {
  const durationMs = config.gameDurationSeconds * 1000;
  const timeToFireAllMs = config.targetKillCount * config.fireCooldownMs;

  if (timeToFireAllMs > durationMs) {
    return {
      severity: "error",
      code: "INSUFFICIENT_FIRE_TIME",
      message:
        "Le nombre d'ennemis à détruire ne peut pas être atteint, même en tirant sans interruption, avant la fin du temps imparti.",
    };
  }

  if (timeToFireAllMs > durationMs * TIGHT_WINDOW_RATIO) {
    return {
      severity: "warning",
      code: "TIGHT_FIRE_WINDOW",
      message:
        "Atteindre l'objectif de destruction nécessite de tirer quasiment sans interruption jusqu'à la fin du temps imparti.",
    };
  }

  return null;
}

export const shooterSemanticRules: SemanticRule<ShooterGameConfig>[] = [
  checkDuration,
  checkFireBudget,
];
