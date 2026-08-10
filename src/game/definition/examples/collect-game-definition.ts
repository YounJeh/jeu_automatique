import { templateMechanics } from "../../mechanics/template-mechanics.js";
import {
  COLLECT_CANVAS_HEIGHT,
  COLLECT_CANVAS_WIDTH,
  COLLECT_COLLECTIBLE_SIZE,
  COLLECT_PLAYER_SIZE,
  defaultCollectConfig,
} from "../../templates/collect/collect-config.js";
import type { GameDefinition } from "../game-definition-schema.js";

const SCORE_PER_COLLECTIBLE = 10;

// Read-only conversion of the existing collect template into GameDefinition
// v1 (CLAUDE.md §12 exit criteria, same pattern as dodgeGameDefinitionExample
// from PHASE 5). Does not modify or wire into collect-engine.ts/
// collect-template.ts.
export const collectGameDefinitionExample: GameDefinition = {
  version: "1",
  metadata: {
    id: defaultCollectConfig.id,
    title: defaultCollectConfig.title,
    description: defaultCollectConfig.description,
    theme: defaultCollectConfig.theme,
  },
  world: {
    width: COLLECT_CANVAS_WIDTH,
    height: COLLECT_CANVAS_HEIGHT,
    boundaries: "clamp",
    durationSeconds: defaultCollectConfig.gameDurationSeconds,
  },
  player: {
    speed: defaultCollectConfig.playerSpeed,
    size: COLLECT_PLAYER_SIZE,
    appearance: {
      type: "shape",
      shape: "rectangle",
      color: defaultCollectConfig.playerColor,
    },
  },
  entities: [
    {
      id: "collectible",
      kind: "collectible",
      size: COLLECT_COLLECTIBLE_SIZE,
      spawnIntervalMs: defaultCollectConfig.collectibleSpawnIntervalMs,
      appearance: {
        type: "shape",
        shape: "circle",
        color: defaultCollectConfig.collectibleColor,
      },
    },
  ],
  mechanics: templateMechanics.collect,
  rules: [
    {
      when: "player-collides-collectible",
      then: [
        { type: "increase-score", amount: SCORE_PER_COLLECTIBLE },
        { type: "remove-entity" },
      ],
    },
    { when: "score-reached", then: [{ type: "win-game" }] },
    { when: "timer-expired", then: [{ type: "lose-game" }] },
  ],
  goals: [
    {
      type: "score",
      target:
        defaultCollectConfig.targetCollectibleCount * SCORE_PER_COLLECTIBLE,
    },
  ],
  presentation: {
    backgroundColor: defaultCollectConfig.backgroundColor,
    victoryMessage: defaultCollectConfig.victoryMessage,
    defeatMessage: defaultCollectConfig.defeatMessage,
  },
};
