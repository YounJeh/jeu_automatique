import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";
import {
  rectsOverlap,
  type GameStatus,
  type InputState,
  type Vector2,
} from "../../core/game-state.js";
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
  private msSinceLastEnemySpawn = 0;
  private msSinceLastShot = 0;

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
    this.msSinceLastEnemySpawn = 0;
    this.msSinceLastShot = 0;
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
    const distance = (this.config.playerSpeed * deltaMs) / 1000;
    let { x, y } = this.state.player;

    if (input.left) x -= distance;
    if (input.right) x += distance;
    if (input.up) y -= distance;
    if (input.down) y += distance;

    x = Math.max(0, Math.min(SHOOTER_CANVAS_WIDTH - SHOOTER_PLAYER_SIZE, x));
    y = Math.max(0, Math.min(SHOOTER_CANVAS_HEIGHT - SHOOTER_PLAYER_SIZE, y));

    return { x, y };
  }

  private computeProjectiles(
    deltaMs: number,
    input: InputState,
    player: Vector2,
  ): Vector2[] {
    this.msSinceLastShot += deltaMs;
    let projectiles = this.state.projectiles;

    if (input.fire && this.msSinceLastShot >= this.config.fireCooldownMs) {
      this.msSinceLastShot = 0;
      const x =
        player.x + SHOOTER_PLAYER_SIZE / 2 - SHOOTER_PROJECTILE_SIZE / 2;
      const y = player.y - SHOOTER_PROJECTILE_SIZE;
      projectiles = [...projectiles, { x, y }];
    }

    const distance = (this.config.projectileSpeed * deltaMs) / 1000;
    return projectiles
      .map((projectile) => ({ x: projectile.x, y: projectile.y - distance }))
      .filter((projectile) => projectile.y + SHOOTER_PROJECTILE_SIZE > 0);
  }

  private computeEnemies(deltaMs: number): Vector2[] {
    this.msSinceLastEnemySpawn += deltaMs;
    let enemies = this.state.enemies;

    if (this.msSinceLastEnemySpawn >= this.config.enemySpawnIntervalMs) {
      this.msSinceLastEnemySpawn = 0;
      const x = this.random() * (SHOOTER_CANVAS_WIDTH - SHOOTER_ENEMY_SIZE);
      enemies = [...enemies, { x, y: -SHOOTER_ENEMY_SIZE }];
    }

    const distance = (this.config.enemySpeed * deltaMs) / 1000;
    return enemies
      .map((enemy) => ({ x: enemy.x, y: enemy.y + distance }))
      .filter((enemy) => enemy.y < SHOOTER_CANVAS_HEIGHT + SHOOTER_ENEMY_SIZE);
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
    const playerRect = {
      x: player.x,
      y: player.y,
      size: SHOOTER_PLAYER_SIZE,
    };
    const finalEnemies: Vector2[] = [];
    let damageTaken = 0;

    for (const enemy of enemies) {
      if (
        rectsOverlap(playerRect, {
          x: enemy.x,
          y: enemy.y,
          size: SHOOTER_ENEMY_SIZE,
        })
      ) {
        damageTaken += 1;
      } else {
        finalEnemies.push(enemy);
      }
    }

    return { finalEnemies, damageTaken };
  }
}
