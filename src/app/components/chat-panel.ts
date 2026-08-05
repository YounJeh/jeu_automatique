import {
  generateGameFromPrompt,
  MAX_GAME_PROMPT_LENGTH,
} from "../services/chat-service.js";
import { saveGeneratedGame } from "../services/game-catalog-service.js";
import { renderChatMessage } from "./chat-message.js";
import { renderGenerationStatus } from "./generation-status.js";
import type { ChatMessage, ChatMessageRole } from "../types/chat-message.js";
import type { GameCatalogItem } from "../../game/types/game-catalog-item.js";
import { GameGenerationError } from "../../mastra/errors/game-generation-error.js";

export type ChatPanelOptions = {
  historyContainer: HTMLElement;
  statusContainer: HTMLElement;
  form: HTMLFormElement;
  input: HTMLTextAreaElement;
  sendButton: HTMLButtonElement;
  resultContainer: HTMLElement;
  summaryElement: HTMLElement;
  testButton: HTMLButtonElement;
  onGameGenerated: (item: GameCatalogItem) => void;
  onTestGame: (item: GameCatalogItem) => void;
};

export function initChatPanel({
  historyContainer,
  statusContainer,
  form,
  input,
  sendButton,
  resultContainer,
  summaryElement,
  testButton,
  onGameGenerated,
  onTestGame,
}: ChatPanelOptions): void {
  input.maxLength = MAX_GAME_PROMPT_LENGTH;

  let lastGeneratedItem: GameCatalogItem | null = null;

  function pushMessage(role: ChatMessageRole, content: string): void {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    historyContainer.append(renderChatMessage(message));
    historyContainer.scrollTop = historyContainer.scrollHeight;
  }

  function setBusy(busy: boolean): void {
    input.disabled = busy;
    sendButton.disabled = busy;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = input.value;

    if (prompt.trim().length === 0) return;

    pushMessage("user", prompt.trim());
    input.value = "";
    resultContainer.hidden = true;
    testButton.disabled = true;
    setBusy(true);
    renderGenerationStatus(statusContainer, "sending");

    generateGameFromPrompt(prompt, (status) => {
      renderGenerationStatus(statusContainer, status);
    })
      .then((result) => {
        const item = saveGeneratedGame(result);
        lastGeneratedItem = item;
        pushMessage("assistant", result.summary);
        summaryElement.textContent = result.summary;
        resultContainer.hidden = false;
        testButton.disabled = false;
        onGameGenerated(item);
      })
      .catch((error: unknown) => {
        const messageText =
          error instanceof GameGenerationError
            ? error.message
            : "Une erreur est survenue pendant la création du jeu. Réessaie.";
        pushMessage("assistant", messageText);
        renderGenerationStatus(statusContainer, "error");
      })
      .finally(() => {
        setBusy(false);
      });
  });

  testButton.addEventListener("click", () => {
    if (lastGeneratedItem) onTestGame(lastGeneratedItem);
  });
}
