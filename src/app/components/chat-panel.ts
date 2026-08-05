import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";
import { findGameById } from "../../game/catalog/game-catalog.js";
import type { ChatMessage } from "../types/chat-message.js";
import { generateGameMock } from "../services/chat-service.js";
import { GameGenerationError } from "../errors/game-generation-error.js";
import { renderChatMessage } from "./chat-message.js";
import { renderGenerationStatus } from "./generation-status.js";

export type ChatPanelElements = {
  messageList: HTMLElement;
  form: HTMLFormElement;
  input: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  statusEl: HTMLElement;
  errorEl: HTMLElement;
  testButton: HTMLButtonElement;
  backButton: HTMLButtonElement;
};

export type ChatPanelOptions = {
  elements: ChatPanelElements;
  onTestGame: (item: GameCatalogItem) => void;
  onBack: () => void;
};

function appendMessage(list: HTMLElement, message: ChatMessage): void {
  list.append(renderChatMessage(message));
  list.scrollTop = list.scrollHeight;
}

export function initChatPanel({
  elements,
  onTestGame,
  onBack,
}: ChatPanelOptions): void {
  let lastGeneratedGameId: string | null = null;

  elements.testButton.disabled = true;

  elements.testButton.addEventListener("click", () => {
    if (!lastGeneratedGameId) return;
    const item = findGameById(lastGeneratedGameId);
    if (item) onTestGame(item);
  });

  elements.backButton.addEventListener("click", () => onBack());

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = elements.input.value.trim();
    if (!prompt || elements.sendButton.disabled) return;

    elements.errorEl.textContent = "";
    elements.testButton.disabled = true;
    lastGeneratedGameId = null;

    appendMessage(elements.messageList, {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      createdAt: new Date().toISOString(),
      status: "sent",
    });

    elements.input.value = "";
    elements.input.disabled = true;
    elements.sendButton.disabled = true;

    generateGameMock(prompt, (status) => {
      renderGenerationStatus(elements.statusEl, status);
    })
      .then((result) => {
        lastGeneratedGameId = result.game.id;
        appendMessage(elements.messageList, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.summary,
          createdAt: result.createdAt,
          status: "sent",
        });
        elements.testButton.disabled = false;
      })
      .catch((error: unknown) => {
        const message =
          error instanceof GameGenerationError
            ? error.message
            : "Une erreur est survenue pendant la génération du jeu.";

        elements.errorEl.textContent = message;
        appendMessage(elements.messageList, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: message,
          createdAt: new Date().toISOString(),
          status: "error",
        });
      })
      .finally(() => {
        elements.input.disabled = false;
        elements.sendButton.disabled = false;
      });
  });
}
