export type AiModel = "groq" | "gemini" | "nim";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  model: AiModel;
  timestamp: string;
  pending?: boolean;
  failed?: boolean;
}

export interface ChatSession {
  _id: string;
  title: string;
  selectedModel: AiModel;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: {
    username: string;
    email: string;
    createdAt: string;
  };
  stats: {
    totalChats: number;
    totalMessages: number;
  };
}
