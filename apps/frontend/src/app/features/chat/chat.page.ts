import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, computed, inject, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AiModel, ChatSession } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { ChatService } from "../../core/services/chat.service";
import { MotionEnterDirective } from "../../shared/motion-enter.directive";
import { MarkdownPipe } from "../../shared/markdown.pipe";

interface GroupedHistory {
  label: string;
  chats: ChatSession[];
}

@Component({
  selector: "app-chat-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MotionEnterDirective, MarkdownPipe],
  templateUrl: "./chat.page.html",
  styleUrl: "./chat.page.scss"
})
export class ChatPage implements AfterViewInit {
  protected readonly models: AiModel[] = ["groq", "gemini", "nim"];
  protected readonly sidebarCollapsed = signal(false);
  protected readonly draft = signal("");
  protected readonly selectedModel = signal<AiModel>("gemini");
  protected readonly loadingChats = signal(true);
  protected readonly chatService = inject(ChatService);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sidebarRef = viewChild<ElementRef<HTMLElement>>("sidebar");

  protected readonly groupedHistory = computed<GroupedHistory[]>(() => {
    const groups = new Map<string, ChatSession[]>();
    for (const chat of this.chatService.chats()) {
      const label = this.toDateLabel(chat.updatedAt);
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(chat);
    }
    return Array.from(groups.entries()).map(([label, chats]) => ({ label, chats }));
  });

  protected readonly typing = computed(() => {
    const messages = this.chatService.currentChat()?.messages ?? [];
    const last = messages[messages.length - 1];
    return Boolean(last?.role === "assistant" && last.pending);
  });

  protected readonly currentMessages = computed(() => this.chatService.currentChat()?.messages ?? []);

  constructor() {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigateByUrl("/auth");
      return;
    }
    void this.load();
  }

  ngAfterViewInit(): void {
    const sidebar = this.sidebarRef();
    if (sidebar) {
      sidebar.nativeElement.animate(
        [
          { opacity: 0, transform: "translateX(-12px)" },
          { opacity: 1, transform: "translateX(0px)" }
        ],
        { duration: 260, easing: "ease-out" }
      );
    }
  }

  protected async createChat() {
    const chat = await this.chatService.createChat(this.selectedModel());
    this.selectedModel.set(chat.selectedModel);
    this.draft.set("");
  }

  protected async selectChat(chatId: string) {
    await this.chatService.openChat(chatId);
    const current = this.chatService.currentChat();
    if (current) {
      this.selectedModel.set(current.selectedModel);
    }
  }

  protected onComposerInput(event: Event) {
    const element = event.target as HTMLTextAreaElement;
    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 220)}px`;
  }

  protected onComposerKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  protected async send() {
    await this.chatService.sendMessage(this.draft(), this.selectedModel());
    this.draft.set("");
  }

  protected async cancel() {
    await this.chatService.cancelStreaming();
  }

  protected async removeChat(chatId: string, event: Event) {
    event.stopPropagation();
    await this.chatService.deleteChat(chatId);
  }

  protected async copy(content: string) {
    await navigator.clipboard.writeText(content);
  }

  protected async regenerate() {
    await this.chatService.regenerateLast(this.selectedModel());
  }

  protected toggleSidebar() {
    this.sidebarCollapsed.update((value) => !value);
    const sidebar = this.sidebarRef();
    if (!sidebar) {
      return;
    }
    sidebar.nativeElement.animate(
      [
        { width: this.sidebarCollapsed() ? "280px" : "82px" },
        { width: this.sidebarCollapsed() ? "82px" : "280px" }
      ],
      { duration: 220, easing: "ease-out" }
    );
  }

  protected logout() {
    this.auth.logout();
    void this.router.navigateByUrl("/auth");
  }

  private async load() {
    try {
      await this.chatService.loadChats();
      const current = this.chatService.currentChat();
      if (current) {
        this.selectedModel.set(current.selectedModel);
      }
    } finally {
      this.loadingChats.set(false);
    }
  }

  private toDateLabel(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(date, today)) {
      return "Today";
    }
    if (sameDay(date, yesterday)) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  }
}
