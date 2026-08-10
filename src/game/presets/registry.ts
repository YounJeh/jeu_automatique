import type { GameTemplate } from "../types/game-template.js";
import { collectPreset } from "./collect.js";
import { dodgePreset } from "./dodge.js";
import type { GamePreset } from "./game-preset.js";
import { shooterPreset } from "./shooter.js";

// Central registry of presets, same pattern as
// src/game/templates/game-template-catalog.ts.
export const gamePresets: Record<GameTemplate, GamePreset> = {
  dodge: dodgePreset,
  collect: collectPreset,
  shooter: shooterPreset,
};

export function getGamePreset(template: GameTemplate): GamePreset {
  return gamePresets[template];
}

export function listGamePresets(): readonly GamePreset[] {
  return Object.values(gamePresets);
}
