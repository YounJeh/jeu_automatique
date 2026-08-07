import type { ValidationIssue } from "../types.js";

export type SemanticReport = {
  valid: boolean;
  issues: ValidationIssue[];
};

export type SemanticRule<TConfig> = (config: TConfig) => ValidationIssue | null;

export interface SemanticValidator<TConfig> {
  readonly rules: readonly SemanticRule<TConfig>[];
  validate(config: TConfig): SemanticReport;
}

/**
 * Combine une liste de règles pures en un validateur unique : chaque règle
 * inspecte la cohérence arithmétique entre des champs déclarés (sans
 * geometrie ni notion de temps de réaction du joueur, réservées à la couche
 * playability) et retourne au plus une issue.
 */
export function createSemanticValidator<TConfig>(
  rules: readonly SemanticRule<TConfig>[],
): SemanticValidator<TConfig> {
  return {
    rules,
    validate(config) {
      const issues = rules
        .map((rule) => rule(config))
        .filter((issue): issue is ValidationIssue => issue !== null);

      return {
        valid: issues.every((issue) => issue.severity !== "error"),
        issues,
      };
    },
  };
}
