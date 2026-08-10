import type { GameDefinition } from "../definition/game-definition-schema.js";
import type { GameTemplate } from "../types/game-template.js";

// PHASE 7: a preset packages an id/template envelope around an existing
// GameDefinition so it can be looked up by template (registry.ts) without
// duplicating the definition's content.
export type GamePreset = {
  id: string;
  template: GameTemplate;
  definition: GameDefinition;
};
