import { getCatalog } from "../game/catalog/game-catalog.js";
import { GameController } from "../game/game-controller.js";
import type { GameCatalogItem } from "../game/types/game-catalog-item.js";
import { initGameSidebar } from "./components/game-sidebar.js";
import { initChatPanel } from "./components/chat-panel.js";

type ViewName = "play" | "create";

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
  const playView = requireElement<HTMLElement>("#play-view");
  const createView = requireElement<HTMLElement>("#create-view");
  const canvas = requireElement<HTMLCanvasElement>("#game-canvas");
  const gameList = requireElement<HTMLElement>("#game-list");
  const createGameButton = requireElement<HTMLButtonElement>(
    "#create-game-button",
  );
  const backButton = requireElement<HTMLButtonElement>("#back-to-games-button");
  const restartButton = requireElement<HTMLButtonElement>("#restart-button");
  const titleEl = requireElement<HTMLElement>("#game-title");
  const descriptionEl = requireElement<HTMLElement>("#game-description");
  const statusEl = requireElement<HTMLElement>("#game-status");

  function showView(view: ViewName): void {
    playView.hidden = view !== "play";
    createView.hidden = view !== "create";
  }

  const controller = new GameController(canvas);
  controller.setUpdateListener((update) => {
    statusEl.textContent = `Score : ${update.score} — ${statusLabel(update.status)}`;
  });

  function selectGame(item: GameCatalogItem): void {
    titleEl.textContent = item.title;
    descriptionEl.textContent = item.description;
    controller.loadGame(item);
    sidebar.setActive(item.id);
    showView("play");
  }

  const sidebar = initGameSidebar({
    listElement: gameList,
    createButton: createGameButton,
    onSelectGame: selectGame,
    onCreateGame: () => showView("create"),
  });

  sidebar.render(getCatalog());

  const firstGame = getCatalog()[0];
  if (firstGame) selectGame(firstGame);

  initChatPanel({
    historyContainer: requireElement<HTMLElement>("#chat-history"),
    statusContainer: requireElement<HTMLElement>("#generation-status"),
    form: requireElement<HTMLFormElement>("#chat-form"),
    input: requireElement<HTMLTextAreaElement>("#chat-input"),
    sendButton: requireElement<HTMLButtonElement>("#chat-send-button"),
    resultContainer: requireElement<HTMLElement>("#generation-result"),
    summaryElement: requireElement<HTMLElement>("#generation-summary"),
    testButton: requireElement<HTMLButtonElement>("#test-game-button"),
    onGameGenerated: (item) => {
      sidebar.render(getCatalog(), item.id);
    },
    onTestGame: (item) => {
      selectGame(item);
    },
  });

  restartButton.addEventListener("click", () => controller.restart());
  backButton.addEventListener("click", () => showView("play"));
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  document.body.textContent = `Erreur au démarrage du jeu : ${message}`;
}
