import type { DodgeGameConfig } from "../../../mastra/schemas/dodge-game-config-schema.js";

export const DODGE_CANVAS_WIDTH = 480;
export const DODGE_CANVAS_HEIGHT = 640;
export const DODGE_PLAYER_SIZE = 28;
export const DODGE_OBSTACLE_SIZE = 28;

export const defaultDodgeConfig: DodgeGameConfig = {
  id: "dodge-game",
  title: "Meteor Dodge",
  description: "Évite les météorites le plus longtemps possible.",
  theme: "space",
  template: "dodge",
  playerColor: "#4fd1c5",
  backgroundColor: "#0b1021",
  obstacleColor: "#f56565",
  playerSpeed: 220,
  obstacleSpeed: 160,
  obstacleSpawnIntervalMs: 700,
  gameDurationSeconds: 30,
  victoryMessage: "Vaisseau sauvé !",
  defeatMessage: "Vaisseau détruit...",
};
