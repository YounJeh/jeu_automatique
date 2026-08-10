import type { GameMechanic } from "../registry.js";

export type HybridPocConfig = {
  playerSpeed: number;
  obstacleSpeed: number;
  obstacleSpawnIntervalMs: number;
  collectibleSpawnIntervalMs: number;
  targetCollectibleCount: number;
};

export const HYBRID_POC_CANVAS_WIDTH = 480;
export const HYBRID_POC_CANVAS_HEIGHT = 640;
export const HYBRID_POC_PLAYER_SIZE = 28;
export const HYBRID_POC_OBSTACLE_SIZE = 28;
export const HYBRID_POC_COLLECTIBLE_SIZE = 20;

export const defaultHybridPocConfig: HybridPocConfig = {
  playerSpeed: 220,
  obstacleSpeed: 160,
  obstacleSpawnIntervalMs: 700,
  collectibleSpawnIntervalMs: 900,
  targetCollectibleCount: 8,
};

// Internal/test-only POC (CLAUDE.md §11.4) — never register under GAME_TEMPLATES, gameTemplateDefinitions, or gameConfigSchema.
export const hybridPocMechanics: GameMechanic[] = ["move", "collect", "avoid"];
