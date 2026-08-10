import { collectGameDefinitionExample } from "../definition/examples/collect-game-definition.js";
import type { GamePreset } from "./game-preset.js";

export const collectPreset: GamePreset = {
  id: "collect-preset",
  template: "collect",
  definition: collectGameDefinitionExample,
};
