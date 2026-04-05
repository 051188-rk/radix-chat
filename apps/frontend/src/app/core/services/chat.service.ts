import { computed, Injectable, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { AiModel, ChatMessage, ChatSession } from "../models";

interface SseEvent {
  event: string;
  data: string;
}

@Injectable({ providedIn: "root" })
export class ChatService {
  private readonly chatsState = signal<ChatSession[]>([]);
  private readonly selectedChatIdState = signal<string | null>(null);
  private readonly streamingState = signal(false);
  private readonly activeRequestIdState = signal<string | null>(null);

  private activeAbortController: AbortController | null = null;

  readonly chats = computed(() => this.chatsState());
  readonly selectedChatId = computed(() => this.selectedChatIdState());
  readonly isStreaming = computed(() => this.streamingState());
  readonly activeRequestId = computed(() => this.activeRequestIdState());
  readonly currentChat = computed(() =>
    this.chatsState().find((chat) => chat._id === this.selectedChatIdState()) ?? null
  );

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  async loadChats() {
    const chats = await this.api.request<ChatSession[]>("/chats", {
      method: "GET",
      headers: this.auth.authHeaders()
    });
    this.chatsState.set(chats);
    if (!this.selectedChatIdState() && chats.length > 0) {
      this.selectedChatIdState.set(chats[0]._id);
    }
  }

  async createChat(model: AiModel): Promise<ChatSession> {
    const chat = await this.api.request<ChatSession>("/chats", {
      method: "POST",
      headers: this.auth.authHeaders(),
      body: JSON.stringify({ model })
    });
    this.chatsState.update((chats) => [chat, ...chats]);
    this.selectedChatIdState.set(chat._id);
    return chat;
  }

  async openChat(chatId: string) {
    const chat = await this.api.request<ChatSession>(`/chats/${chatId}`, {
      method: "GET",
      headers: this.auth.authHeaders()
    });
    this.chatsState.update((chats) => {
      const existingIndex = chats.findIndex((item) => item._id === chat._id);
      if (existingIndex === -1) {
        return [chat, ...chats];
      }
      const next = [...chats];
      next[existingIndex] = chat;
      return next;
    });
    this.selectedChatIdState.set(chatId);
  }

  selectChat(chatId: string) {
    this.selectedChatIdState.set(chatId);
  }

  async deleteChat(chatId: string) {
    await this.api.request<void>(`/chats/${chatId}`, {
      method: "DELETE",
      headers: this.auth.authHeaders()
    });
    this.chatsState.update((chats) => chats.filter((chat) => chat._id !== chatId));
    if (this.selectedChatIdState() === chatId) {
      this.selectedChatIdState.set(this.chatsState()[0]?._id ?? null);
    }
  }

  async sendMessage(content: string, model: AiModel): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed || this.streamingState()) {
      return;
    }

    let chatId = this.selectedChatIdState();
    if (!chatId) {
      const created = await this.createChat(model);
      chatId = created._id;
    }
    if (!chatId) {
      return;
    }

    const timestamp = new Date().toISOString();
    const userMessage: ChatMessage = { role: "user", content: trimmed, model, timestamp };
    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      model,
      timestamp,
      pending: true
    };

    this.updateChat(chatId, (chat) => ({
      ...chat,
      selectedModel: model,
      messages: [...chat.messages, userMessage, assistantMessage],
      updatedAt: timestamp
    }));

    const requestId = crypto.randomUUID();
    this.activeRequestIdState.set(requestId);
    this.streamingState.set(true);
    this.activeAbortController = new AbortController();

    const response = await fetch(this.api.requestUrl(`/chats/${chatId}/stream`), {
      method: "POST",
      headers: this.auth.authHeaders({
        "Content-Type": "application/json",
        "x-request-id": requestId
      }),
      body: JSON.stringify({ content: trimmed, model }),
      signal: this.activeAbortController.signal
    });

    if (!response.ok || !response.body) {
      this.finishStreamingError(chatId, "Streaming failed");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = this.extractEvents(buffer);
        buffer = events.remaining;

        for (const event of events.events) {
          if (event.event === "token") {
            const payload = JSON.parse(event.data) as { token: string };
            this.updateAssistantDraft(chatId, payload.token);
          }
          if (event.event === "done") {
            this.finishStreamingSuccess(chatId);
          }
          if (event.event === "error") {
            const payload = JSON.parse(event.data) as { message?: string };
            this.finishStreamingError(chatId, payload.message ?? "Model error");
          }
          if (event.event === "cancelled") {
            this.finishStreamingError(chatId, "Request cancelled");
          }
        }
      }
    } catch {
      this.finishStreamingError(chatId, "Streaming interrupted");
    } finally {
      reader.releaseLock();
      this.streamingState.set(false);
      this.activeRequestIdState.set(null);
      this.activeAbortController = null;
    }
  }

  async cancelStreaming() {
    const requestId = this.activeRequestIdState();
    const chatId = this.selectedChatIdState();
    this.activeAbortController?.abort();

    if (!requestId || !chatId) {
      return;
    }

    await this.api.request<{ message: string }>(`/chats/${chatId}/cancel/${requestId}`, {
      method: "POST",
      headers: this.auth.authHeaders()
    });
  }

  async regenerateLast(model: AiModel) {
    const chat = this.currentChat();
    if (!chat) {
      return;
    }
    const lastUser = [...chat.messages].reverse().find((item) => item.role === "user");
    if (!lastUser) {
      return;
    }
    await this.sendMessage(lastUser.content, model);
  }

  private extractEvents(buffer: string): { events: SseEvent[]; remaining: string } {
    const blocks = buffer.split("\n\n");
    const remaining = blocks.pop() ?? "";
    const events: SseEvent[] = [];

    for (const block of blocks) {
      const eventMatch = block.match(/event:\s*(.+)/);
      const dataMatch = block.match(/data:\s*(.+)/);
      if (eventMatch && dataMatch) {
        events.push({ event: eventMatch[1].trim(), data: dataMatch[1].trim() });
      }
    }
    return { events, remaining };
  }

  private updateAssistantDraft(chatId: string, token: string) {
    this.updateChat(chatId, (chat) => {
      const messages = [...chat.messages];
      const index = messages.length - 1;
      if (index < 0) {
        return chat;
      }
      const last = messages[index];
      if (last.role !== "assistant") {
        return chat;
      }
      messages[index] = { ...last, content: `${last.content}${token}` };
      return { ...chat, messages };
    });
  }

  private finishStreamingSuccess(chatId: string) {
    this.updateChat(chatId, (chat) => {
      const messages = [...chat.messages];
      const index = messages.length - 1;
      if (index >= 0 && messages[index].role === "assistant") {
        messages[index] = { ...messages[index], pending: false, failed: false };
      }
      return { ...chat, messages, updatedAt: new Date().toISOString() };
    });
  }

  private finishStreamingError(chatId: string, message: string) {
    this.updateChat(chatId, (chat) => {
      const messages = [...chat.messages];
      const index = messages.length - 1;
      if (index >= 0 && messages[index].role === "assistant") {
        messages[index] = {
          ...messages[index],
          pending: false,
          failed: true,
          content: messages[index].content || message
        };
      }
      return { ...chat, messages, updatedAt: new Date().toISOString() };
    });
  }

  private updateChat(chatId: string, updater: (chat: ChatSession) => ChatSession) {
    this.chatsState.update((chats) =>
      chats.map((chat) => {
        if (chat._id !== chatId) {
          return chat;
        }
        return updater(chat);
      })
    );
  }
}
