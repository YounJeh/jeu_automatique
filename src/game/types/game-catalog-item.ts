import type { GameDefinition } from "../definition/game-definition-schema.js";
import type { GameConfig } from "./game-config.js";
import type { GameTemplate } from "./game-template.js";

export type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  template: GameTemplate;
  config: GameConfig;
  // PHASE 7: optional GameDefinition counterpart, used by GameController
  // to route to GenericRuntime when GENERIC_RUNTIME_ENABLED is set and
  // isGenericRuntimeCapable(definition) is true. Absent for items that
  // predate PHASE 7.
  definition?: GameDefinition;
  source: "built-in" | "generated";
  createdAt?: string;
};
