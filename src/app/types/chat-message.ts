export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  status?: "sending" | "sent" | "error";
};
