import { builtInGames } from "./built-in-games.js";
import type { GameCatalogItem } from "../types/game-catalog-item.js";

const generatedGames: GameCatalogItem[] = [];

export function getCatalog(): GameCatalogItem[] {
  return [...builtInGames, ...generatedGames];
}

export function findGameById(id: string): GameCatalogItem | undefined {
  return getCatalog().find((item) => item.id === id);
}

export function addGeneratedGame(item: GameCatalogItem): GameCatalogItem {
  if (getCatalog().some((existing) => existing.id === item.id)) {
    throw new Error(`Un jeu avec l'identifiant "${item.id}" existe déjà.`);
  }

  generatedGames.push(item);
  return item;
}

export function resetGeneratedGames(): void {
  generatedGames.length = 0;
}
