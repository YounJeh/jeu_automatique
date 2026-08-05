import { getCatalog } from "../game/catalog/game-catalog.js";
import { GameController } from "../game/game-controller.js";
import type { GameCatalogItem } from "../game/types/game-catalog-item.js";
import { initGameSelector } from "./components/game-selector.js";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Élément introuvable dans la page : ${selector}`);
  }
  return element;
}

function statusLabel(status: string): string {
  if (status === "won") return "Gagné";
  if (status === "lost") return "Perdu";
  return "En cours";
}

function main(): void {
  const canvas = requireElement<HTMLCanvasElement>("#game-canvas");
  const select = requireElement<HTMLSelectElement>("#game-select");
  const restartButton = requireElement<HTMLButtonElement>("#restart-button");
  const titleEl = requireElement<HTMLElement>("#game-title");
  const descriptionEl = requireElement<HTMLElement>("#game-description");
  const statusEl = requireElement<HTMLElement>("#game-status");

  const controller = new GameController(canvas);
  controller.setUpdateListener((update) => {
    statusEl.textContent = `Score : ${update.score} — ${statusLabel(update.status)}`;
  });

  const items = getCatalog();

  initGameSelector({
    select,
    items,
    onSelect: (item: GameCatalogItem) => {
      titleEl.textContent = item.title;
      descriptionEl.textContent = item.description;
      controller.loadGame(item);
    },
  });

  restartButton.addEventListener("click", () => controller.restart());
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  document.body.textContent = `Erreur au démarrage du jeu : ${message}`;
}
