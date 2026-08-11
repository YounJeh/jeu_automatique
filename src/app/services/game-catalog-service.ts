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
  if (!result.game) {
    // PHASE 7 Task 11 wires the mechanics -> GameDefinition pipeline
    // through to the frontend; until then every real result carries
    // "game" (the legacy classify -> config pipeline), never only
    // "definition" — see generatedGameResultSchema's refine.
    throw new Error(
      'Résultat généré sans "game" : pipeline GameDefinition pas encore câblé côté frontend.',
    );
  }

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
