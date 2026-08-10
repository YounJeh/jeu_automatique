import { validateMechanicSet } from "../mechanics/compatibility.js";
import type { SemanticRule } from "../validation/semantic/semantic-validator.js";
import type { ValidationIssue } from "../validation/types.js";
import type { GameDefinition } from "./game-definition-schema.js";

/**
 * Un objet apparaissant après la fin de la partie ne peut jamais être vu :
 * arithmétique pure sur spawnIntervalMs/durationSeconds, sans géométrie ni
 * vitesse du joueur (réservées à la couche playability).
 */
function checkEntitySpawnWithinDuration(
  definition: GameDefinition,
): ValidationIssue | null {
  const { durationSeconds } = definition.world;
  if (durationSeconds === undefined) return null;

  const durationMs = durationSeconds * 1000;
  const lateEntity = definition.entities.find(
    (entity) =>
      entity.spawnIntervalMs !== undefined &&
      entity.spawnIntervalMs > durationMs,
  );

  if (!lateEntity) return null;

  return {
    severity: "error",
    code: "ENTITY_SPAWN_EXCEEDS_DURATION",
    message: `L'entité "${lateEntity.id}" ne peut jamais apparaître : son intervalle de spawn dépasse la durée de la partie.`,
  };
}

/**
 * Les mécaniques déclarées doivent satisfaire leurs dépendances (PHASE 4,
 * src/game/mechanics/compatibility.ts) — cohérence entre les éléments d'un
 * même champ, pas de géométrie ni de vitesse.
 */
function checkMechanicsConsistency(
  definition: GameDefinition,
): ValidationIssue | null {
  const issues = validateMechanicSet(definition.mechanics);
  return issues[0] ?? null;
}

/**
 * Une RuleAction "spawn-entity" doit référencer une entité réellement
 * déclarée : cohérence entre le champ "rules" et le champ "entities".
 */
function checkSpawnEntityReferences(
  definition: GameDefinition,
): ValidationIssue | null {
  const knownEntityIds = new Set(definition.entities.map((e) => e.id));

  for (const rule of definition.rules) {
    for (const action of rule.then) {
      if (
        action.type === "spawn-entity" &&
        !knownEntityIds.has(action.entityId)
      ) {
        return {
          severity: "error",
          code: "UNKNOWN_SPAWN_ENTITY_REFERENCE",
          message: `L'action "spawn-entity" référence l'entité "${action.entityId}", absente de "entities".`,
        };
      }
    }
  }

  return null;
}

/**
 * Un objectif "destroy" n'est atteignable que si au moins une entité
 * "enemy" existe : cohérence entre "goals" et "entities".
 */
function checkDestroyGoalReachable(
  definition: GameDefinition,
): ValidationIssue | null {
  const hasDestroyGoal = definition.goals.some((g) => g.type === "destroy");
  if (!hasDestroyGoal) return null;

  const hasEnemyEntity = definition.entities.some((e) => e.kind === "enemy");
  if (hasEnemyEntity) return null;

  return {
    severity: "error",
    code: "UNREACHABLE_DESTROY_GOAL",
    message:
      'Un objectif "destroy" est déclaré mais aucune entité "enemy" n\'existe.',
  };
}

/**
 * Un objectif "score" n'est atteignable que si au moins une règle peut
 * augmenter le score : cohérence entre "goals" et "rules".
 */
function checkScoreGoalReachable(
  definition: GameDefinition,
): ValidationIssue | null {
  const hasScoreGoal = definition.goals.some((g) => g.type === "score");
  if (!hasScoreGoal) return null;

  const hasIncreaseScoreAction = definition.rules.some((rule) =>
    rule.then.some((action) => action.type === "increase-score"),
  );
  if (hasIncreaseScoreAction) return null;

  return {
    severity: "error",
    code: "UNREACHABLE_SCORE_GOAL",
    message:
      'Un objectif "score" est déclaré mais aucune règle n\'augmente le score.',
  };
}

export const gameDefinitionSemanticRules: SemanticRule<GameDefinition>[] = [
  checkEntitySpawnWithinDuration,
  checkMechanicsConsistency,
  checkSpawnEntityReferences,
  checkDestroyGoalReachable,
  checkScoreGoalReachable,
];
