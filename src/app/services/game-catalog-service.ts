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
  if (result.game) {
    return addGeneratedGame({
      // result.id, not result.game.id: a fallback-to-preset result
      // (Task 10) can carry a preset's own id, which would collide with
      // its built-in catalog entry — result.id is always freshly
      // generated server-side for the catalog item itself.
      id: result.id,
      title: result.game.title,
      description: result.game.description,
      template: result.template,
      source: "generated",
      config: result.game,
      createdAt: result.createdAt,
    });
  }

  if (result.definition) {
    return addGeneratedGame({
      id: result.id,
      title: result.definition.metadata.title,
      description: result.definition.metadata.description,
      template: result.template,
      source: "generated",
      definition: result.definition,
      createdAt: result.createdAt,
    });
  }

  // Unreachable given generatedGameResultSchema's refine (exactly one of
  // game/definition is always set) — kept as a typed guard rather than a
  // non-null assertion.
  throw new Error('Résultat généré sans "game" ni "definition".');
}
