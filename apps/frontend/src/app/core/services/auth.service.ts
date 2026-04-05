import { computed, Injectable, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { AuthResponse, AuthUser } from "../models";

const TOKEN_KEY = "ai-chat-token";
const USER_KEY = "ai-chat-user";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<AuthUser | null>(this.readStoredUser());

  readonly token = computed(() => this.tokenState());
  readonly user = computed(() => this.userState());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  constructor(private readonly api: ApiService) {}

  async login(email: string, password: string): Promise<void> {
    const data = await this.api.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    this.persistAuth(data);
  }

  async signup(username: string, email: string, password: string): Promise<void> {
    const data = await this.api.request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password })
    });
    this.persistAuth(data);
  }

  authHeaders(extra: HeadersInit = {}): HeadersInit {
    const token = this.tokenState();
    return {
      ...extra,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  logout() {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private persistAuth(data: AuthResponse) {
    this.tokenState.set(data.token);
    this.userState.set(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
