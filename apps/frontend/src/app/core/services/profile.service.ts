import { Injectable } from "@angular/core";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { ProfileResponse } from "../models";

@Injectable({ providedIn: "root" })
export class ProfileService {
  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  async loadProfile(): Promise<ProfileResponse> {
    return this.api.request<ProfileResponse>("/profile", {
      method: "GET",
      headers: this.auth.authHeaders()
    });
  }
}
