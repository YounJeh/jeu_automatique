import { templateMechanics } from "../mechanics/template-mechanics.js";
import {
  SHOOTER_CANVAS_HEIGHT,
  SHOOTER_CANVAS_WIDTH,
  SHOOTER_ENEMY_SIZE,
  SHOOTER_PLAYER_SIZE,
  SHOOTER_PROJECTILE_SIZE,
  defaultShooterConfig,
} from "../templates/shooter/shooter-config.js";
import type { GameDefinition } from "../definition/game-definition-schema.js";
import type { GamePreset } from "./game-preset.js";

const SCORE_PER_KILL = 10;

// Read-only conversion of the existing shooter template into a
// GameDefinition (CLAUDE.md §14.1). Representable and fully valid
// (schema/semantic/playability), but NOT executable by GenericRuntime yet:
// the "shoot" mechanic needs a fire-triggered projectile spawn and N:M
// projectile<->enemy collision that the runtime doesn't have (see
// tasks/plan.md and docs/mechanics/shoot.md). The "projectile" entity
// below therefore has no speed/spawnIntervalMs — it exists so the schema
// and rules can reference it, but GenericRuntime never spawns it.
// isGenericRuntimeCapable() routes this preset to ShooterEngine instead.
export const shooterGameDefinition: GameDefinition = {
  version: "1",
  metadata: {
    id: defaultShooterConfig.id,
    title: defaultShooterConfig.title,
    description: defaultShooterConfig.description,
    theme: defaultShooterConfig.theme,
  },
  world: {
    width: SHOOTER_CANVAS_WIDTH,
    height: SHOOTER_CANVAS_HEIGHT,
    boundaries: "clamp",
    durationSeconds: defaultShooterConfig.gameDurationSeconds,
  },
  player: {
    speed: defaultShooterConfig.playerSpeed,
    size: SHOOTER_PLAYER_SIZE,
    health: defaultShooterConfig.playerHealth,
    appearance: {
      type: "shape",
      shape: "rectangle",
      color: defaultShooterConfig.playerColor,
    },
  },
  entities: [
    {
      id: "enemy",
      kind: "enemy",
      size: SHOOTER_ENEMY_SIZE,
      speed: defaultShooterConfig.enemySpeed,
      spawnIntervalMs: defaultShooterConfig.enemySpawnIntervalMs,
      appearance: {
        type: "shape",
        shape: "rectangle",
        color: defaultShooterConfig.enemyColor,
      },
    },
    {
      id: "projectile",
      kind: "projectile",
      size: SHOOTER_PROJECTILE_SIZE,
      appearance: {
        type: "shape",
        shape: "circle",
        color: defaultShooterConfig.projectileColor,
      },
    },
  ],
  mechanics: templateMechanics.shooter,
  rules: [
    {
      when: "player-collides-enemy",
      then: [{ type: "damage-player", amount: 1 }, { type: "remove-entity" }],
    },
    { when: "health-zero", then: [{ type: "lose-game" }] },
    {
      when: "projectile-collides-enemy",
      then: [
        { type: "increase-score", amount: SCORE_PER_KILL },
        { type: "remove-entity" },
      ],
    },
    { when: "score-reached", then: [{ type: "win-game" }] },
    { when: "timer-expired", then: [{ type: "lose-game" }] },
  ],
  goals: [
    {
      type: "score",
      target: defaultShooterConfig.targetKillCount * SCORE_PER_KILL,
    },
  ],
  presentation: {
    backgroundColor: defaultShooterConfig.backgroundColor,
    victoryMessage: defaultShooterConfig.victoryMessage,
    defeatMessage: defaultShooterConfig.defeatMessage,
  },
};

export const shooterPreset: GamePreset = {
  id: "shooter-preset",
  template: "shooter",
  definition: shooterGameDefinition,
};
