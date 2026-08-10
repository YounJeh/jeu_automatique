import { dodgeGameDefinitionExample } from "../definition/examples/dodge-game-definition.js";
import type { GamePreset } from "./game-preset.js";

export const dodgePreset: GamePreset = {
  id: "dodge-preset",
  template: "dodge",
  definition: dodgeGameDefinitionExample,
};
