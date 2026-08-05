import type { GameConfig } from "./game-config.js";
import type { GameTemplate } from "./game-template.js";

export type GameCatalogItem = {
  id: string;
  title: string;
  description: string;
  template: GameTemplate;
  config: GameConfig;
  source: "built-in" | "generated";
  createdAt?: string;
};
