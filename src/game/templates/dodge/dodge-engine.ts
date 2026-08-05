import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";
import {
  rectsOverlap,
  type GameStatus,
  type InputState,
  type Vector2,
} from "../../core/game-state.js";
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
  private msSinceLastSpawn = 0;

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
    this.msSinceLastSpawn = 0;
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
    const distance = (this.config.playerSpeed * deltaMs) / 1000;
    let { x, y } = this.state.player;

    if (input.left) x -= distance;
    if (input.right) x += distance;
    if (input.up) y -= distance;
    if (input.down) y += distance;

    x = Math.max(0, Math.min(DODGE_CANVAS_WIDTH - DODGE_PLAYER_SIZE, x));
    y = Math.max(0, Math.min(DODGE_CANVAS_HEIGHT - DODGE_PLAYER_SIZE, y));

    return { x, y };
  }

  private computeObstacles(deltaMs: number): Vector2[] {
    this.msSinceLastSpawn += deltaMs;
    let obstacles = this.state.obstacles;

    if (this.msSinceLastSpawn >= this.config.obstacleSpawnIntervalMs) {
      this.msSinceLastSpawn = 0;
      const x = this.random() * (DODGE_CANVAS_WIDTH - DODGE_OBSTACLE_SIZE);
      obstacles = [...obstacles, { x, y: -DODGE_OBSTACLE_SIZE }];
    }

    const distance = (this.config.obstacleSpeed * deltaMs) / 1000;
    return obstacles
      .map((obstacle) => ({ x: obstacle.x, y: obstacle.y + distance }))
      .filter(
        (obstacle) => obstacle.y < DODGE_CANVAS_HEIGHT + DODGE_OBSTACLE_SIZE,
      );
  }

  private hasCollision(player: Vector2, obstacles: Vector2[]): boolean {
    const playerRect = { x: player.x, y: player.y, size: DODGE_PLAYER_SIZE };
    return obstacles.some((obstacle) =>
      rectsOverlap(playerRect, {
        x: obstacle.x,
        y: obstacle.y,
        size: DODGE_OBSTACLE_SIZE,
      }),
    );
  }
}
