import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ProfileResponse } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { ProfileService } from "../../core/services/profile.service";
import { MotionEnterDirective } from "../../shared/motion-enter.directive";

@Component({
  selector: "app-profile-page",
  standalone: true,
  imports: [CommonModule, RouterLink, MotionEnterDirective],
  templateUrl: "./profile.page.html",
  styleUrl: "./profile.page.scss"
})
export class ProfilePage {
  protected readonly data = signal<ProfileResponse | null>(null);
  protected readonly loading = signal(true);

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  constructor() {
    void this.load();
  }

  protected logout() {
    this.auth.logout();
    void this.router.navigateByUrl("/auth");
  }

  private async load() {
    try {
      const data = await this.profileService.loadProfile();
      this.data.set(data);
    } finally {
      this.loading.set(false);
    }
  }
}
