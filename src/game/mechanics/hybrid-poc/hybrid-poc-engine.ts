import type { GameStatus, InputState, Vector2 } from "../../core/game-state.js";
import { partitionByCollision } from "../../systems/collision/collision-system.js";
import { computeMovement } from "../../systems/movement/movement-system.js";
import {
  advanceAndCull,
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import {
  HYBRID_POC_CANVAS_HEIGHT,
  HYBRID_POC_CANVAS_WIDTH,
  HYBRID_POC_COLLECTIBLE_SIZE,
  HYBRID_POC_OBSTACLE_SIZE,
  HYBRID_POC_PLAYER_SIZE,
  type HybridPocConfig,
} from "./hybrid-poc-config.js";

export type HybridPocEngineState = {
  status: GameStatus;
  player: Vector2;
  obstacles: Vector2[];
  collectibles: Vector2[];
  elapsedMs: number;
  score: number;
  collectedCount: number;
};

export class HybridPocEngine {
  private readonly config: HybridPocConfig;
  private readonly random: () => number;
  private state: HybridPocEngineState;
  private obstacleSpawnAccumulator: SpawnAccumulator = {
    msSinceLastSpawn: 0,
  };
  private collectibleSpawnAccumulator: SpawnAccumulator = {
    msSinceLastSpawn: 0,
  };
  private spawnedCollectibleCount = 0;

  constructor(config: HybridPocConfig, random: () => number = Math.random) {
    this.config = config;
    this.random = random;
    this.state = this.createInitialState();
  }

  private createInitialState(): HybridPocEngineState {
    return {
      status: "playing",
      player: {
        x: HYBRID_POC_CANVAS_WIDTH / 2 - HYBRID_POC_PLAYER_SIZE / 2,
        y: HYBRID_POC_CANVAS_HEIGHT / 2 - HYBRID_POC_PLAYER_SIZE / 2,
      },
      obstacles: [],
      collectibles: [],
      elapsedMs: 0,
      score: 0,
      collectedCount: 0,
    };
  }

  reset(): void {
    this.obstacleSpawnAccumulator = { msSinceLastSpawn: 0 };
    this.collectibleSpawnAccumulator = { msSinceLastSpawn: 0 };
    this.spawnedCollectibleCount = 0;
    this.state = this.createInitialState();
  }

  getState(): HybridPocEngineState {
    return this.state;
  }

  update(deltaMs: number, input: InputState): HybridPocEngineState {
    if (this.state.status !== "playing") {
      return this.state;
    }

    const player = this.computePlayerPosition(deltaMs, input);
    const obstacles = this.computeObstacles(deltaMs);
    const spawnedCollectibles = this.computeCollectibles(deltaMs);
    const { remaining: collectibles, collectedNow } = this.collectOverlapping(
      player,
      spawnedCollectibles,
    );

    const collectedCount = this.state.collectedCount + collectedNow;
    const elapsedMs = this.state.elapsedMs + deltaMs;

    let status: GameStatus = "playing";
    if (this.hasObstacleCollision(player, obstacles)) {
      status = "lost";
    } else if (collectedCount >= this.config.targetCollectibleCount) {
      status = "won";
    }

    this.state = {
      status,
      player,
      obstacles,
      collectibles,
      elapsedMs,
      score: collectedCount * 10,
      collectedCount,
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
        width: HYBRID_POC_CANVAS_WIDTH,
        height: HYBRID_POC_CANVAS_HEIGHT,
        size: HYBRID_POC_PLAYER_SIZE,
      },
    );
  }

  private computeObstacles(deltaMs: number): Vector2[] {
    const { spawn, next } = shouldSpawn(
      this.obstacleSpawnAccumulator,
      deltaMs,
      this.config.obstacleSpawnIntervalMs,
    );
    this.obstacleSpawnAccumulator = next;

    let obstacles = this.state.obstacles;
    if (spawn) {
      const x =
        this.random() * (HYBRID_POC_CANVAS_WIDTH - HYBRID_POC_OBSTACLE_SIZE);
      obstacles = [...obstacles, { x, y: -HYBRID_POC_OBSTACLE_SIZE }];
    }

    return advanceAndCull(
      obstacles,
      { x: 0, y: this.config.obstacleSpeed },
      deltaMs,
      (position) =>
        position.y >= HYBRID_POC_CANVAS_HEIGHT + HYBRID_POC_OBSTACLE_SIZE,
    );
  }

  private computeCollectibles(deltaMs: number): Vector2[] {
    const { spawn, next } = shouldSpawn(
      this.collectibleSpawnAccumulator,
      deltaMs,
      this.config.collectibleSpawnIntervalMs,
    );
    this.collectibleSpawnAccumulator = next;

    let collectibles = this.state.collectibles;
    if (
      spawn &&
      this.spawnedCollectibleCount < this.config.targetCollectibleCount
    ) {
      this.spawnedCollectibleCount += 1;
      const x =
        this.random() * (HYBRID_POC_CANVAS_WIDTH - HYBRID_POC_COLLECTIBLE_SIZE);
      const y =
        this.random() *
        (HYBRID_POC_CANVAS_HEIGHT - HYBRID_POC_COLLECTIBLE_SIZE);
      collectibles = [...collectibles, { x, y }];
    }

    return collectibles;
  }

  private collectOverlapping(
    player: Vector2,
    collectibles: Vector2[],
  ): { remaining: Vector2[]; collectedNow: number } {
    const { hit, remaining } = partitionByCollision(
      player,
      HYBRID_POC_PLAYER_SIZE,
      collectibles,
      HYBRID_POC_COLLECTIBLE_SIZE,
    );

    return { remaining, collectedNow: hit.length };
  }

  private hasObstacleCollision(player: Vector2, obstacles: Vector2[]): boolean {
    return (
      partitionByCollision(
        player,
        HYBRID_POC_PLAYER_SIZE,
        obstacles,
        HYBRID_POC_OBSTACLE_SIZE,
      ).hit.length > 0
    );
  }
}
