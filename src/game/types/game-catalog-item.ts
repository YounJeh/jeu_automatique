import type { GameDefinition } from "../definition/game-definition-schema.js";
import type { GameConfig } from "./game-config.js";
import type { GameTemplate } from "./game-template.js";

export type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  template: GameTemplate;
  // PHASE 7: built-in items carry both; a generated item carries exactly
  // one of the two (legacy classify->config pipeline, or the
  // mechanics->GameDefinition pipeline, Task 10/11 — see
  // generatedGameCatalogItemSchema, which enforces this at the boundary).
  // GameController falls back to the legacy per-template engine only when
  // config is present; a definition-only item must be
  // isGenericRuntimeCapable().
  config?: GameConfig;
  definition?: GameDefinition;
  source: "built-in" | "generated";
  createdAt?: string;
};
