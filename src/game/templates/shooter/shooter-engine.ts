import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";
import {
  rectsOverlap,
  type GameStatus,
  type InputState,
  type Vector2,
} from "../../core/game-state.js";
import { partitionByCollision } from "../../systems/collision/collision-system.js";
import { computeMovement } from "../../systems/movement/movement-system.js";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import {
  SHOOTER_CANVAS_HEIGHT,
  SHOOTER_CANVAS_WIDTH,
  SHOOTER_ENEMY_SIZE,
  SHOOTER_PLAYER_SIZE,
  SHOOTER_PROJECTILE_SIZE,
} from "./shooter-config.js";

export type ShooterEngineState = {
  status: GameStatus;
  player: Vector2;
  health: number;
  enemies: Vector2[];
  projectiles: Vector2[];
  elapsedMs: number;
  score: number;
  killCount: number;
};

export class ShooterEngine {
  private readonly config: ShooterGameConfig;
  private readonly random: () => number;
  private state: ShooterEngineState;
  private enemySpawnAccumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };
  private shotAccumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };

  constructor(config: ShooterGameConfig, random: () => number = Math.random) {
    this.config = config;
    this.random = random;
    this.state = this.createInitialState();
  }

  private createInitialState(): ShooterEngineState {
    return {
      status: "playing",
      player: {
        x: SHOOTER_CANVAS_WIDTH / 2 - SHOOTER_PLAYER_SIZE / 2,
        y: SHOOTER_CANVAS_HEIGHT - SHOOTER_PLAYER_SIZE * 2,
      },
      health: this.config.playerHealth,
      enemies: [],
      projectiles: [],
      elapsedMs: 0,
      score: 0,
      killCount: 0,
    };
  }

  reset(): void {
    this.enemySpawnAccumulator = { msSinceLastSpawn: 0 };
    this.shotAccumulator = { msSinceLastSpawn: 0 };
    this.state = this.createInitialState();
  }

  getState(): ShooterEngineState {
    return this.state;
  }

  update(deltaMs: number, input: InputState): ShooterEngineState {
    if (this.state.status !== "playing") {
      return this.state;
    }

    const player = this.computePlayerPosition(deltaMs, input);
    const projectiles = this.computeProjectiles(deltaMs, input, player);
    const enemies = this.computeEnemies(deltaMs);

    const { survivingEnemies, remainingProjectiles, killedThisTick } =
      this.resolveProjectileCollisions(enemies, projectiles);
    const { finalEnemies, damageTaken } = this.resolvePlayerCollisions(
      player,
      survivingEnemies,
    );

    const health = Math.max(0, this.state.health - damageTaken);
    const killCount = this.state.killCount + killedThisTick;
    const elapsedMs = this.state.elapsedMs + deltaMs;

    let status: GameStatus = "playing";
    if (killCount >= this.config.targetKillCount) {
      status = "won";
    } else if (health <= 0) {
      status = "lost";
    } else if (elapsedMs / 1000 >= this.config.gameDurationSeconds) {
      status = "lost";
    }

    this.state = {
      status,
      player,
      health,
      enemies: finalEnemies,
      projectiles: remainingProjectiles,
      elapsedMs,
      score: killCount * 10,
      killCount,
    };

    return this.state;
  }

  private computePlayerPosition(deltaMs: number, input: InputState): Vector2 {
    return computeMovement(
      this.state.player,
      this.config.playerSpeed,
      deltaMs,
      input,
      {
        width: SHOOTER_CANVAS_WIDTH,
        height: SHOOTER_CANVAS_HEIGHT,
        size: SHOOTER_PLAYER_SIZE,
      },
    );
  }

  private computeProjectiles(
    deltaMs: number,
    input: InputState,
    player: Vector2,
  ): Vector2[] {
    // The cooldown must only reset when a shot is actually fired (input.fire
    // held true) — unlike a plain timer-driven spawn, it stays "ready" and
    // keeps accumulating while the player isn't firing, so shouldSpawn's
    // unconditional reset-on-threshold can't be reused here without
    // changing when the next shot becomes available.
    const msSinceLastShot = this.shotAccumulator.msSinceLastSpawn + deltaMs;
    let projectiles = this.state.projectiles;

    if (input.fire && msSinceLastShot >= this.config.fireCooldownMs) {
      this.shotAccumulator = { msSinceLastSpawn: 0 };
      const x =
        player.x + SHOOTER_PLAYER_SIZE / 2 - SHOOTER_PROJECTILE_SIZE / 2;
      const y = player.y - SHOOTER_PROJECTILE_SIZE;
      projectiles = [...projectiles, { x, y }];
    } else {
      this.shotAccumulator = { msSinceLastSpawn: msSinceLastShot };
    }

    return advanceAndCull(
      projectiles,
      { x: 0, y: -this.config.projectileSpeed },
      deltaMs,
      (position) => position.y + SHOOTER_PROJECTILE_SIZE <= 0,
    );
  }

  private computeEnemies(deltaMs: number): Vector2[] {
    const { spawn, next } = shouldSpawn(
      this.enemySpawnAccumulator,
      deltaMs,
      this.config.enemySpawnIntervalMs,
    );
    this.enemySpawnAccumulator = next;

    let enemies = this.state.enemies;
    if (spawn) {
      const x = this.random() * (SHOOTER_CANVAS_WIDTH - SHOOTER_ENEMY_SIZE);
      enemies = [...enemies, { x, y: -SHOOTER_ENEMY_SIZE }];
    }

    return advanceAndCull(
      enemies,
      { x: 0, y: this.config.enemySpeed },
      deltaMs,
      (position) => position.y >= SHOOTER_CANVAS_HEIGHT + SHOOTER_ENEMY_SIZE,
    );
  }

  private resolveProjectileCollisions(
    enemies: Vector2[],
    projectiles: Vector2[],
  ): {
    survivingEnemies: Vector2[];
    remainingProjectiles: Vector2[];
    killedThisTick: number;
  } {
    const hitProjectileIndices = new Set<number>();
    const survivingEnemies: Vector2[] = [];
    let killedThisTick = 0;

    for (const enemy of enemies) {
      const enemyRect = { x: enemy.x, y: enemy.y, size: SHOOTER_ENEMY_SIZE };
      const hitIndex = projectiles.findIndex(
        (projectile, index) =>
          !hitProjectileIndices.has(index) &&
          rectsOverlap(enemyRect, {
            x: projectile.x,
            y: projectile.y,
            size: SHOOTER_PROJECTILE_SIZE,
          }),
      );

      if (hitIndex >= 0) {
        hitProjectileIndices.add(hitIndex);
        killedThisTick += 1;
      } else {
        survivingEnemies.push(enemy);
      }
    }

    const remainingProjectiles = projectiles.filter(
      (_, index) => !hitProjectileIndices.has(index),
    );

    return { survivingEnemies, remainingProjectiles, killedThisTick };
  }

  private resolvePlayerCollisions(
    player: Vector2,
    enemies: Vector2[],
  ): { finalEnemies: Vector2[]; damageTaken: number } {
    const { hit, remaining } = partitionByCollision(
      player,
      SHOOTER_PLAYER_SIZE,
      enemies,
      SHOOTER_ENEMY_SIZE,
    );

    return { finalEnemies: remaining, damageTaken: hit.length };
  }
}
