import { defaultDodgeConfig } from "../templates/dodge/dodge-config.js";
import { defaultCollectConfig } from "../templates/collect/collect-config.js";
import type { GameCatalogItem } from "../types/game-catalog-item.js";

export const builtInGames: GameCatalogItem[] = [
  {
    id: "dodge-game",
    title: defaultDodgeConfig.title,
    description: defaultDodgeConfig.description,
    template: "dodge",
    source: "built-in",
    config: defaultDodgeConfig,
  },
  {
    id: "collect-game",
    title: defaultCollectConfig.title,
    description: defaultCollectConfig.description,
    template: "collect",
    source: "built-in",
    config: defaultCollectConfig,
  },
];
