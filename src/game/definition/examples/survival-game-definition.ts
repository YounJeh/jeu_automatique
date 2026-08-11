import { templateMechanics } from "../../mechanics/template-mechanics.js";
import type { GameDefinition } from "../game-definition-schema.js";

// PHASE 10: first "top-down survival" family member. Unlike
// dodge/collect/shooter, this preset has no legacy Config/Engine/Renderer
// — it is GameDefinition-only, executed exclusively by GenericRuntime
// (CLAUDE.md §17, specs/phase10-top-down-survival.md). Constants live here
// rather than in a templates/survival/*-config.ts, since there is no
// legacy engine to share them with.
export const SURVIVAL_CANVAS_WIDTH = 480;
export const SURVIVAL_CANVAS_HEIGHT = 640;
export const SURVIVAL_PLAYER_SIZE = 28;
export const SURVIVAL_CHASER_SIZE = 24;
export const SURVIVAL_DURATION_SECONDS = 30;

export const survivalGameDefinition: GameDefinition = {
  version: "1",
  metadata: {
    id: "survival-game",
    title: "Survie",
    description:
      "Survis pendant 30 secondes à un poursuivant qui te traque sans relâche.",
    theme: "survival",
  },
  world: {
    width: SURVIVAL_CANVAS_WIDTH,
    height: SURVIVAL_CANVAS_HEIGHT,
    boundaries: "clamp",
    durationSeconds: SURVIVAL_DURATION_SECONDS,
  },
  player: {
    speed: 220,
    size: SURVIVAL_PLAYER_SIZE,
    health: 3,
    appearance: { type: "shape", shape: "rectangle", color: "#4fd1c5" },
  },
  entities: [
    {
      id: "chaser",
      kind: "enemy",
      size: SURVIVAL_CHASER_SIZE,
      // Deliberately slower than player.speed (220): checkSeekEntityEscapable
      // (game-definition-playability-rules.ts) would otherwise warn that
      // the player can never outrun it.
      speed: 140,
      spawnIntervalMs: 4000,
      movementPattern: "seek",
      appearance: { type: "shape", shape: "circle", color: "#e53e3e" },
    },
  ],
  mechanics: templateMechanics.survival,
  rules: [
    {
      when: "player-collides-enemy",
      then: [{ type: "damage-player", amount: 1 }, { type: "remove-entity" }],
    },
    { when: "health-zero", then: [{ type: "lose-game" }] },
    { when: "timer-expired", then: [{ type: "win-game" }] },
  ],
  goals: [{ type: "survive", durationSeconds: SURVIVAL_DURATION_SECONDS }],
  presentation: {
    backgroundColor: "#0b1021",
    victoryMessage: "Tu as survécu !",
    defeatMessage: "Rattrapé...",
  },
};
