export const GAME_TEMPLATES = [
  "dodge",
  "collect",
  "shooter",
  "survival",
] as const;

export type GameTemplate = (typeof GAME_TEMPLATES)[number];

// PHASE 10: templates that still have a legacy Config/Engine/Renderer
// (PHASE 0-2, src/game/templates/**). New templates are GameDefinition-only
// by default (PHASE 7 direction, CLAUDE.md §17) — only add a template here
// if it genuinely gets a legacy engine built for it. Drives the classify
// -> config pipeline (generate-game-workflow.ts) and
// game-template-catalog.ts, both of which require every member to have a
// real Config/Engine.
export const LEGACY_GAME_TEMPLATES = ["dodge", "collect", "shooter"] as const;

export type LegacyGameTemplate = (typeof LEGACY_GAME_TEMPLATES)[number];
