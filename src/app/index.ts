import { getCatalog } from "../game/catalog/game-catalog.js";
import { GameController } from "../game/game-controller.js";
import type { GameCatalogItem } from "../game/types/game-catalog-item.js";
import {
  addSelectorOption,
  initGameSelector,
} from "./components/game-selector.js";
import { initChatPanel } from "./components/chat-panel.js";

type AppMode = "play" | "create";

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

  const playSection = requireElement<HTMLElement>("#play-section");
  const createSection = requireElement<HTMLElement>("#create-section");
  const modePlayButton = requireElement<HTMLButtonElement>("#mode-play-button");
  const modeCreateButton = requireElement<HTMLButtonElement>(
    "#mode-create-button",
  );

  function setMode(mode: AppMode): void {
    playSection.hidden = mode !== "play";
    createSection.hidden = mode !== "create";
    modePlayButton.setAttribute("aria-pressed", String(mode === "play"));
    modeCreateButton.setAttribute("aria-pressed", String(mode === "create"));
  }

  modePlayButton.addEventListener("click", () => setMode("play"));
  modeCreateButton.addEventListener("click", () => setMode("create"));

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

  initChatPanel({
    elements: {
      messageList: requireElement<HTMLElement>("#chat-messages"),
      form: requireElement<HTMLFormElement>("#chat-form"),
      input: requireElement<HTMLTextAreaElement>("#chat-input"),
      sendButton: requireElement<HTMLButtonElement>("#chat-send-button"),
      statusEl: requireElement<HTMLElement>("#generation-status"),
      errorEl: requireElement<HTMLElement>("#generation-error"),
      testButton: requireElement<HTMLButtonElement>(
        "#test-generated-game-button",
      ),
      backButton: requireElement<HTMLButtonElement>("#back-to-games-button"),
    },
    onTestGame: (item: GameCatalogItem) => {
      addSelectorOption(select, item);
      select.value = item.id;
      titleEl.textContent = item.title;
      descriptionEl.textContent = item.description;
      controller.loadGame(item);
      setMode("play");
    },
    onBack: () => setMode("play"),
  });

  setMode("play");
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  document.body.textContent = `Erreur au démarrage du jeu : ${message}`;
}
