import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { MotionEnterDirective } from "../../shared/motion-enter.directive";

@Component({
  selector: "app-auth-page",
  standalone: true,
  imports: [CommonModule, FormsModule, MotionEnterDirective],
  templateUrl: "./auth.page.html",
  styleUrl: "./auth.page.scss"
})
export class AuthPage {
  protected readonly authMode = signal<"login" | "signup">("login");
  protected readonly username = signal("");
  protected readonly email = signal("");
  protected readonly password = signal("");
  protected readonly loading = signal(false);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl("/chat");
    }
  }

  protected setMode(mode: "login" | "signup") {
    this.authMode.set(mode);
  }

  protected async submit() {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    try {
      if (this.authMode() === "login") {
        await this.auth.login(this.email().trim(), this.password().trim());
      } else {
        await this.auth.signup(this.username().trim(), this.email().trim(), this.password().trim());
      }
      await this.router.navigateByUrl("/chat");
    } finally {
      this.loading.set(false);
    }
  }
}
