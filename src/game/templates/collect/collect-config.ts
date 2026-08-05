import type { CollectGameConfig } from "../../../mastra/schemas/collect-game-config-schema.js";

export const COLLECT_CANVAS_WIDTH = 480;
export const COLLECT_CANVAS_HEIGHT = 640;
export const COLLECT_PLAYER_SIZE = 28;
export const COLLECT_COLLECTIBLE_SIZE = 20;

export const defaultCollectConfig: CollectGameConfig = {
  id: "collect-game",
  title: "Crystal Collector",
  description: "Collecte tous les cristaux avant la fin du temps.",
  theme: "crystal cave",
  template: "collect",
  playerColor: "#f6ad55",
  backgroundColor: "#1a202c",
  collectibleColor: "#68d391",
  playerSpeed: 240,
  targetCollectibleCount: 10,
  collectibleSpawnIntervalMs: 900,
  gameDurationSeconds: 30,
  victoryMessage: "Tous les cristaux collectés !",
  defeatMessage: "Temps écoulé...",
};
