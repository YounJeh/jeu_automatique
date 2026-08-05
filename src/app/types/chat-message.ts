export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageStatus = "sending" | "sent" | "error";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  status?: ChatMessageStatus;
};
