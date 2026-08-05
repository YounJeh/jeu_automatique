import {
  addGeneratedGame,
  getCatalog,
} from "../../game/catalog/game-catalog.js";
import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";
import type { GeneratedGameResult } from "./chat-service.js";

export function listGames(): GameCatalogItem[] {
  return getCatalog();
}

export function saveGeneratedGame(
  result: GeneratedGameResult,
): GameCatalogItem {
  const item: GameCatalogItem = {
    id: result.game.id,
    title: result.game.title,
    description: result.game.description,
    template: result.game.template,
    source: "generated",
    config: result.game,
    createdAt: result.createdAt,
  };

  return addGeneratedGame(item);
}
