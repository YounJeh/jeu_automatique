import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";
import {
  rectsOverlap,
  type GameStatus,
  type InputState,
  type Vector2,
} from "../../core/game-state.js";
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
  private msSinceLastSpawn = 0;
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
    this.msSinceLastSpawn = 0;
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
    const distance = (this.config.playerSpeed * deltaMs) / 1000;
    let { x, y } = this.state.player;

    if (input.left) x -= distance;
    if (input.right) x += distance;
    if (input.up) y -= distance;
    if (input.down) y += distance;

    x = Math.max(0, Math.min(COLLECT_CANVAS_WIDTH - COLLECT_PLAYER_SIZE, x));
    y = Math.max(0, Math.min(COLLECT_CANVAS_HEIGHT - COLLECT_PLAYER_SIZE, y));

    return { x, y };
  }

  private computeCollectibles(deltaMs: number): Vector2[] {
    this.msSinceLastSpawn += deltaMs;
    let collectibles = this.state.collectibles;

    if (
      this.msSinceLastSpawn >= this.config.collectibleSpawnIntervalMs &&
      this.spawnedCount < this.config.targetCollectibleCount
    ) {
      this.msSinceLastSpawn = 0;
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
    const playerRect = { x: player.x, y: player.y, size: COLLECT_PLAYER_SIZE };
    const remaining: Vector2[] = [];
    let collectedNow = 0;

    for (const collectible of collectibles) {
      if (
        rectsOverlap(playerRect, {
          x: collectible.x,
          y: collectible.y,
          size: COLLECT_COLLECTIBLE_SIZE,
        })
      ) {
        collectedNow += 1;
      } else {
        remaining.push(collectible);
      }
    }

    return { remaining, collectedNow };
  }
}
