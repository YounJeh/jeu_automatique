import type { EntityDefinition } from "./entity-definition-schema.js";
import type { GameDefinition } from "./game-definition-schema.js";
import type { PlayabilityRule } from "../validation/playability/playability-validator.js";
import type { ValidationIssue } from "../validation/types.js";

const SAFE_PRESSURE_RATIO = 1;
const CRITICAL_PRESSURE_RATIO = 0.5;

/**
 * Le joueur doit tenir dans le monde : géométrie minimale, comme pour
 * dodge/shooter (canvas vs taille des entités).
 */
function checkPlayerFitsWorld(
  definition: GameDefinition,
): ValidationIssue | null {
  const { player, world } = definition;
  if (player.size <= world.width && player.size <= world.height) {
    return null;
  }

  return {
    severity: "error",
    code: "PLAYER_DOES_NOT_FIT_WORLD",
    message: "La taille du joueur dépasse les dimensions du monde.",
  };
}

function threatEntities(definition: GameDefinition): EntityDefinition[] {
  return definition.entities.filter(
    (entity) =>
      (entity.kind === "obstacle" || entity.kind === "enemy") &&
      entity.speed !== undefined &&
      entity.spawnIntervalMs !== undefined,
  );
}

/**
 * Généralise dodgePlayabilityRules.checkObstacleCoverage /
 * shooterPlayabilityRules.checkEnemyCoverage : une entité menaçante
 * manifestement injouable si elle peut occuper toute la largeur du monde
 * en continu (aucune position du joueur ne laisse alors de passage).
 */
function checkEntityCoverage(
  definition: GameDefinition,
): ValidationIssue | null {
  const { world } = definition;

  for (const entity of threatEntities(definition)) {
    const fallTimeMs = (world.height / entity.speed!) * 1000;
    const maxConcurrent = Math.ceil(fallTimeMs / entity.spawnIntervalMs!);

    if (maxConcurrent * entity.size >= world.width) {
      return {
        severity: "error",
        code: "ENTITY_COVERS_WORLD",
        message: `L'entité "${entity.id}" peut occuper toute la largeur du monde en continu : l'évitement devient manifestement impossible.`,
      };
    }
  }

  return null;
}

/**
 * Généralise dodgePlayabilityRules.checkObstaclePressure /
 * shooterPlayabilityRules.checkEnemyPressure : compare la distance que le
 * joueur peut parcourir entre deux apparitions à l'écart moyen laissé
 * entre les entités menaçantes simultanées.
 */
function checkEntityPressure(
  definition: GameDefinition,
): ValidationIssue | null {
  const { world, player } = definition;

  for (const entity of threatEntities(definition)) {
    const fallTimeMs = (world.height / entity.speed!) * 1000;
    const maxConcurrent = Math.max(
      1,
      Math.ceil(fallTimeMs / entity.spawnIntervalMs!),
    );
    const averageGapPx = world.width / maxConcurrent;
    const playerReachPx = (player.speed * entity.spawnIntervalMs!) / 1000;
    const ratio = playerReachPx / averageGapPx;

    if (ratio < SAFE_PRESSURE_RATIO) {
      return {
        severity: ratio < CRITICAL_PRESSURE_RATIO ? "error" : "warning",
        code: "EXCESSIVE_ENTITY_PRESSURE",
        message: `La vitesse et la fréquence de "${entity.id}" laissent trop peu de temps au joueur pour se replacer avant l'apparition suivante.`,
      };
    }
  }

  return null;
}

export const gameDefinitionPlayabilityRules: PlayabilityRule<GameDefinition>[] =
  [checkPlayerFitsWorld, checkEntityCoverage, checkEntityPressure];
