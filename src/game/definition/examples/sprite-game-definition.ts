import { templateMechanics } from "../../mechanics/template-mechanics.js";
import type { GameDefinition } from "../game-definition-schema.js";

const SCORE_PER_COLLECTIBLE = 10;
const TARGET_COLLECTIBLE_COUNT = 5;

// Minimal GameDefinition proving appearance.type: "sprite" end to end
// (schema + semantic + playability + GenericRuntime loading, PHASE 9).
// Structurally a tiny collect-like game; not wired into any preset or
// the built-in catalog — it exists only to exercise the sprite path.
export const spriteGameDefinitionExample: GameDefinition = {
  version: "1",
  metadata: {
    id: "sprite-example",
    title: "Exemple sprite",
    description: "Vérifie le rendu sprite de bout en bout (PHASE 9).",
    theme: "space",
  },
  world: {
    width: 480,
    height: 640,
    boundaries: "clamp",
    durationSeconds: 30,
  },
  player: {
    speed: 220,
    size: 32,
    appearance: {
      type: "sprite",
      assetId: "alien-green",
    },
  },
  entities: [
    {
      id: "crystal",
      kind: "collectible",
      size: 32,
      spawnIntervalMs: 900,
      appearance: {
        type: "sprite",
        assetId: "crystal-purple",
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
      target: TARGET_COLLECTIBLE_COUNT * SCORE_PER_COLLECTIBLE,
    },
  ],
  presentation: {
    backgroundColor: "#111827",
    victoryMessage: "Cristaux collectés !",
    defeatMessage: "Temps écoulé.",
  },
};
