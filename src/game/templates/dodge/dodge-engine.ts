import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";
import type { GameStatus, InputState, Vector2 } from "../../core/game-state.js";
import { partitionByCollision } from "../../systems/collision/collision-system.js";
import { computeMovement } from "../../systems/movement/movement-system.js";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_OBSTACLE_SIZE,
  DODGE_PLAYER_SIZE,
} from "./dodge-config.js";

export type DodgeEngineState = {
  status: GameStatus;
  player: Vector2;
  obstacles: Vector2[];
  elapsedMs: number;
  score: number;
};

export class DodgeEngine {
  private readonly config: DodgeGameConfig;
  private readonly random: () => number;
  private state: DodgeEngineState;
  private spawnAccumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };

  constructor(config: DodgeGameConfig, random: () => number = Math.random) {
    this.config = config;
    this.random = random;
    this.state = this.createInitialState();
  }

  private createInitialState(): DodgeEngineState {
    return {
      status: "playing",
      player: {
        x: DODGE_CANVAS_WIDTH / 2 - DODGE_PLAYER_SIZE / 2,
        y: DODGE_CANVAS_HEIGHT - DODGE_PLAYER_SIZE * 2,
      },
      obstacles: [],
      elapsedMs: 0,
      score: 0,
    };
  }

  reset(): void {
    this.spawnAccumulator = { msSinceLastSpawn: 0 };
    this.state = this.createInitialState();
  }

  getState(): DodgeEngineState {
    return this.state;
  }

  update(deltaMs: number, input: InputState): DodgeEngineState {
    if (this.state.status !== "playing") {
      return this.state;
    }

    const player = this.computePlayerPosition(deltaMs, input);
    const obstacles = this.computeObstacles(deltaMs);

    const elapsedMs = this.state.elapsedMs + deltaMs;
    let status: GameStatus = "playing";
    if (this.hasCollision(player, obstacles)) {
      status = "lost";
    } else if (elapsedMs / 1000 >= this.config.gameDurationSeconds) {
      status = "won";
    }

    this.state = {
      status,
      player,
      obstacles,
      elapsedMs,
      score: Math.floor(elapsedMs / 100),
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
        width: DODGE_CANVAS_WIDTH,
        height: DODGE_CANVAS_HEIGHT,
        size: DODGE_PLAYER_SIZE,
      },
    );
  }

  private computeObstacles(deltaMs: number): Vector2[] {
    const { spawn, next } = shouldSpawn(
      this.spawnAccumulator,
      deltaMs,
      this.config.obstacleSpawnIntervalMs,
    );
    this.spawnAccumulator = next;

    let obstacles = this.state.obstacles;
    if (spawn) {
      const x = this.random() * (DODGE_CANVAS_WIDTH - DODGE_OBSTACLE_SIZE);
      obstacles = [...obstacles, { x, y: -DODGE_OBSTACLE_SIZE }];
    }

    return advanceAndCull(
      obstacles,
      { x: 0, y: this.config.obstacleSpeed },
      deltaMs,
      (position) => position.y >= DODGE_CANVAS_HEIGHT + DODGE_OBSTACLE_SIZE,
    );
  }

  private hasCollision(player: Vector2, obstacles: Vector2[]): boolean {
    return (
      partitionByCollision(
        player,
        DODGE_PLAYER_SIZE,
        obstacles,
        DODGE_OBSTACLE_SIZE,
      ).hit.length > 0
    );
  }
}
