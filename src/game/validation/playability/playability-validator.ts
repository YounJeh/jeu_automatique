import type { ValidationIssue } from "../types.js";

export type PlayabilityReport = {
  playable: boolean;
  issues: ValidationIssue[];
};

export type PlayabilityRule<TConfig> = (
  config: TConfig,
) => ValidationIssue | null;

export interface PlayabilityValidator<TConfig> {
  readonly rules: readonly PlayabilityRule<TConfig>[];
  validate(config: TConfig): PlayabilityReport;
}

/**
 * Combine une liste de règles pures en un validateur unique : chaque règle
 * simule la capacité physique du joueur dans le monde (géométrie du canvas,
 * vitesse, temps de trajet) et retourne au plus une issue.
 */
export function createPlayabilityValidator<TConfig>(
  rules: readonly PlayabilityRule<TConfig>[],
): PlayabilityValidator<TConfig> {
  return {
    rules,
    validate(config) {
      const issues = rules
        .map((rule) => rule(config))
        .filter((issue): issue is ValidationIssue => issue !== null);

      return {
        playable: issues.every((issue) => issue.severity !== "error"),
        issues,
      };
    },
  };
}
