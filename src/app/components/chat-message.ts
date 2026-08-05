import type { ChatMessage } from "../types/chat-message.js";

const ROLE_LABELS: Record<ChatMessage["role"], string> = {
  user: "Vous",
  assistant: "Assistant",
  system: "Système",
};

export function renderChatMessage(message: ChatMessage): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message chat-message--${message.role}`;
  if (message.status === "error") {
    wrapper.classList.add("chat-message--error");
  }

  const roleLabel = document.createElement("span");
  roleLabel.className = "chat-message__role";
  roleLabel.textContent = ROLE_LABELS[message.role];

  const content = document.createElement("p");
  content.className = "chat-message__content";
  content.textContent = message.content;

  wrapper.append(roleLabel, content);
  return wrapper;
}
