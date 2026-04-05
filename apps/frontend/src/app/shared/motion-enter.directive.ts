import { AfterViewInit, Directive, ElementRef, Input } from "@angular/core";

@Directive({
  selector: "[appMotionEnter]",
  standalone: true
})
export class MotionEnterDirective implements AfterViewInit {
  @Input() motionY = 12;
  @Input() motionDuration = 0.24;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.animate(
      [
        { opacity: 0, transform: `translateY(${this.motionY}px)` },
        { opacity: 1, transform: "translateY(0px)" }
      ],
      { duration: this.motionDuration * 1000, easing: "ease-out" }
    );
  }
}
