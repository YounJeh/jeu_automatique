import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { ValidationIssue } from "../types.js";
import type { SemanticRule } from "./semantic-validator.js";

const SHORT_DURATION_SECONDS = 15;
const LONG_DURATION_SECONDS = 100;

/**
 * Signale une durée de partie anormalement courte ou longue : borne relative
 * sur un seul champ déclaré, sans géométrie ni notion de temps de réaction
 * du joueur (réservées à la couche playability).
 */
function checkDuration(config: DodgeGameConfig): ValidationIssue | null {
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

export const dodgeSemanticRules: SemanticRule<DodgeGameConfig>[] = [
  checkDuration,
];
