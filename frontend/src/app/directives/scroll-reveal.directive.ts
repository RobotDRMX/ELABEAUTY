import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale';

@Directive({
  selector: '[scrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('srDelay')     delay     = 0;
  @Input('srDirection') direction: RevealDirection = 'up';
  @Input('srDistance')  distance  = 40;
  @Input('srDuration')  duration  = 600;
  @Input('srThreshold') threshold = 0.12;

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const el = this.el.nativeElement;

    const initial: Record<RevealDirection, string> = {
      up:    `translateY(${this.distance}px)`,
      down:  `translateY(-${this.distance}px)`,
      left:  `translateX(-${this.distance}px)`,
      right: `translateX(${this.distance}px)`,
      scale: 'scale(0.85)'
    };

    el.style.opacity   = '0';
    el.style.transform = initial[this.direction];
    el.style.transition = [
      `opacity ${this.duration}ms cubic-bezier(0.25,0.46,0.45,0.94) ${this.delay}ms`,
      `transform ${this.duration}ms cubic-bezier(0.25,0.46,0.45,0.94) ${this.delay}ms`
    ].join(', ');

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            el.style.opacity   = '1';
            el.style.transform = 'none';
            this.observer.unobserve(el);
          }
        });
      },
      { threshold: this.threshold }
    );

    this.observer.observe(el);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
