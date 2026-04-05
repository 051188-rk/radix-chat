import { Injectable, inject } from "@angular/core";
import { ErrorStateService } from "./error-state.service";

const API_BASE = "http://localhost:4000/api";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly errors = inject(ErrorStateService);

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      const message = payload.message ?? "Request failed";
      this.errors.setError(message);
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  requestUrl(path: string): string {
    return `${API_BASE}${path}`;
  }
}
