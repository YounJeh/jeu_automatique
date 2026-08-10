import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";
import type { GameStatus, InputState, Vector2 } from "../../core/game-state.js";
import { partitionByCollision } from "../../systems/collision/collision-system.js";
import { computeMovement } from "../../systems/movement/movement-system.js";
import {
  shouldSpawn,
  type SpawnAccumulator,
} from "../../systems/spawn/spawn-system.js";
import {
  COLLECT_CANVAS_HEIGHT,
  COLLECT_CANVAS_WIDTH,
  COLLECT_COLLECTIBLE_SIZE,
  COLLECT_PLAYER_SIZE,
} from "./collect-config.js";

export type CollectEngineState = {
  status: GameStatus;
  player: Vector2;
  collectibles: Vector2[];
  elapsedMs: number;
  score: number;
  collectedCount: number;
};

export class CollectEngine {
  private readonly config: CollectGameConfig;
  private readonly random: () => number;
  private state: CollectEngineState;
  private spawnAccumulator: SpawnAccumulator = { msSinceLastSpawn: 0 };
  private spawnedCount = 0;

  constructor(config: CollectGameConfig, random: () => number = Math.random) {
    this.config = config;
    this.random = random;
    this.state = this.createInitialState();
  }

  private createInitialState(): CollectEngineState {
    return {
      status: "playing",
      player: {
        x: COLLECT_CANVAS_WIDTH / 2 - COLLECT_PLAYER_SIZE / 2,
        y: COLLECT_CANVAS_HEIGHT / 2 - COLLECT_PLAYER_SIZE / 2,
      },
      collectibles: [],
      elapsedMs: 0,
      score: 0,
      collectedCount: 0,
    };
  }

  reset(): void {
    this.spawnAccumulator = { msSinceLastSpawn: 0 };
    this.spawnedCount = 0;
    this.state = this.createInitialState();
  }

  getState(): CollectEngineState {
    return this.state;
  }

  update(deltaMs: number, input: InputState): CollectEngineState {
    if (this.state.status !== "playing") {
      return this.state;
    }

    const player = this.computePlayerPosition(deltaMs, input);
    const spawned = this.computeCollectibles(deltaMs);
    const { remaining, collectedNow } = this.collectOverlapping(
      player,
      spawned,
    );

    const collectedCount = this.state.collectedCount + collectedNow;
    const elapsedMs = this.state.elapsedMs + deltaMs;

    let status: GameStatus = "playing";
    if (collectedCount >= this.config.targetCollectibleCount) {
      status = "won";
    } else if (elapsedMs / 1000 >= this.config.gameDurationSeconds) {
      status = "lost";
    }

    this.state = {
      status,
      player,
      collectibles: remaining,
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
        width: COLLECT_CANVAS_WIDTH,
        height: COLLECT_CANVAS_HEIGHT,
        size: COLLECT_PLAYER_SIZE,
      },
    );
  }

  private computeCollectibles(deltaMs: number): Vector2[] {
    const { spawn, next } = shouldSpawn(
      this.spawnAccumulator,
      deltaMs,
      this.config.collectibleSpawnIntervalMs,
    );
    this.spawnAccumulator = next;

    let collectibles = this.state.collectibles;
    if (spawn && this.spawnedCount < this.config.targetCollectibleCount) {
      this.spawnedCount += 1;
      const x =
        this.random() * (COLLECT_CANVAS_WIDTH - COLLECT_COLLECTIBLE_SIZE);
      const y =
        this.random() * (COLLECT_CANVAS_HEIGHT - COLLECT_COLLECTIBLE_SIZE);
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
      COLLECT_PLAYER_SIZE,
      collectibles,
      COLLECT_COLLECTIBLE_SIZE,
    );

    return { remaining, collectedNow: hit.length };
  }
}
