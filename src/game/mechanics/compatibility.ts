import type { ValidationIssue } from "../validation/types.js";
import {
  mechanicRegistry,
  type GameMechanic,
  type MechanicDefinition,
} from "./registry.js";

export function validateMechanicSet(
  mechanics: GameMechanic[],
  registry: Record<GameMechanic, MechanicDefinition> = mechanicRegistry,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const present = new Set(mechanics);

  for (const mechanic of present) {
    for (const dependency of registry[mechanic].dependencies) {
      if (!present.has(dependency)) {
        issues.push({
          severity: "error",
          code: "MISSING_MECHANIC_DEPENDENCY",
          message: `"${mechanic}" requires "${dependency}" to also be present`,
        });
      }
    }
  }

  const checked = new Set<string>();
  for (const mechanic of present) {
    for (const conflict of registry[mechanic].conflicts ?? []) {
      if (!present.has(conflict)) continue;
      const pairKey = [mechanic, conflict].sort().join(":");
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      issues.push({
        severity: "error",
        code: "CONFLICTING_MECHANICS",
        message: `"${mechanic}" conflicts with "${conflict}"`,
      });
    }
  }

  return issues;
}
