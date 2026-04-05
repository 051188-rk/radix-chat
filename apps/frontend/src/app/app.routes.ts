import { Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "auth",
    loadComponent: () => import("./features/auth/auth.page").then((m) => m.AuthPage)
  },
  {
    path: "chat",
    canActivate: [authGuard],
    loadComponent: () => import("./features/chat/chat.page").then((m) => m.ChatPage)
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () => import("./features/profile/profile.page").then((m) => m.ProfilePage)
  },
  { path: "", pathMatch: "full", redirectTo: "chat" },
  { path: "**", redirectTo: "chat" }
];
