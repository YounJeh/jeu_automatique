import { survivalGameDefinition } from "../definition/examples/survival-game-definition.js";
import type { GamePreset } from "./game-preset.js";

export const survivalPreset: GamePreset = {
  id: "survival-preset",
  template: "survival",
  definition: survivalGameDefinition,
};
