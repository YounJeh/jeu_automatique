import { templateMechanics } from "../../mechanics/template-mechanics.js";
import {
  DODGE_CANVAS_HEIGHT,
  DODGE_CANVAS_WIDTH,
  DODGE_OBSTACLE_SIZE,
  DODGE_PLAYER_SIZE,
  defaultDodgeConfig,
} from "../../templates/dodge/dodge-config.js";
import type { GameDefinition } from "../game-definition-schema.js";

// Read-only conversion of the existing dodge template into GameDefinition
// v1 (CLAUDE.md §12 exit criteria). Does not modify or wire into
// dodge-engine.ts/dodge-template.ts.
export const dodgeGameDefinitionExample: GameDefinition = {
  version: "1",
  metadata: {
    id: defaultDodgeConfig.id,
    title: defaultDodgeConfig.title,
    description: defaultDodgeConfig.description,
    theme: defaultDodgeConfig.theme,
  },
  world: {
    width: DODGE_CANVAS_WIDTH,
    height: DODGE_CANVAS_HEIGHT,
    boundaries: "clamp",
    durationSeconds: defaultDodgeConfig.gameDurationSeconds,
  },
  player: {
    speed: defaultDodgeConfig.playerSpeed,
    size: DODGE_PLAYER_SIZE,
    appearance: {
      type: "shape",
      shape: "rectangle",
      color: defaultDodgeConfig.playerColor,
    },
  },
  entities: [
    {
      id: "obstacle",
      kind: "obstacle",
      size: DODGE_OBSTACLE_SIZE,
      speed: defaultDodgeConfig.obstacleSpeed,
      spawnIntervalMs: defaultDodgeConfig.obstacleSpawnIntervalMs,
      appearance: {
        type: "shape",
        shape: "rectangle",
        color: defaultDodgeConfig.obstacleColor,
      },
    },
  ],
  mechanics: templateMechanics.dodge,
  rules: [
    { when: "player-collides-obstacle", then: [{ type: "lose-game" }] },
    { when: "timer-expired", then: [{ type: "win-game" }] },
  ],
  goals: [
    {
      type: "survive",
      durationSeconds: defaultDodgeConfig.gameDurationSeconds,
    },
  ],
  presentation: {
    backgroundColor: defaultDodgeConfig.backgroundColor,
    victoryMessage: defaultDodgeConfig.victoryMessage,
    defeatMessage: defaultDodgeConfig.defeatMessage,
  },
};
