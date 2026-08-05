import type { ChatMessage } from "../types/chat-message.js";

export function renderChatMessage(message: ChatMessage): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message chat-message--${message.role}`;
  if (message.status) {
    wrapper.classList.add(`chat-message--${message.status}`);
  }

  const bubble = document.createElement("p");
  bubble.className = "chat-message__bubble";
  bubble.textContent = message.content;

  wrapper.append(bubble);
  return wrapper;
}
