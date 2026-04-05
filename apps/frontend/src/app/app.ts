import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ErrorStateService } from "./core/services/error-state.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.html",
  styleUrl: "./app.scss"
})
export class App {
  protected readonly errorState = inject(ErrorStateService);

  protected dismissError() {
    this.errorState.clear();
  }
}
