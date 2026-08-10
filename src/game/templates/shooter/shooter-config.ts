import type { ShooterGameConfig } from "../../../mastra/schemas/shooter-game-config-schema.js";

export const SHOOTER_CANVAS_WIDTH = 480;
export const SHOOTER_CANVAS_HEIGHT = 640;
export const SHOOTER_PLAYER_SIZE = 28;
export const SHOOTER_ENEMY_SIZE = 28;
export const SHOOTER_PROJECTILE_SIZE = 8;

export const defaultShooterConfig: ShooterGameConfig = {
  id: "shooter-game",
  title: "Alien Blaster",
  description:
    "Détruis les envahisseurs avant qu'ils n'atteignent ton vaisseau.",
  theme: "space invaders",
  template: "shooter",
  playerColor: "#63b3ed",
  backgroundColor: "#0b1021",
  enemyColor: "#f56565",
  projectileColor: "#faf089",
  playerSpeed: 220,
  enemySpeed: 120,
  enemySpawnIntervalMs: 900,
  projectileSpeed: 400,
  fireCooldownMs: 350,
  playerHealth: 3,
  targetKillCount: 10,
  gameDurationSeconds: 30,
  victoryMessage: "Invasion repoussée !",
  defeatMessage: "Vaisseau détruit...",
};
