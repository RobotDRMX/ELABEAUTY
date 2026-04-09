import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-back-to-top',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      class="back-to-top"
      [class.visible]="visible()"
      (click)="scrollToTop()"
      aria-label="Volver arriba">
      <lucide-icon name="arrow-up" [size]="20"></lucide-icon>
    </button>
  `,
  styles: [`
    .back-to-top {
      position: fixed;
      bottom: 6rem;
      right: 1.5rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary-color);
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-md);
      opacity: 0;
      transform: translateY(12px);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      z-index: 999;

      &:hover { filter: brightness(1.1); }
    }

    .back-to-top.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: all;
    }

    @media (prefers-reduced-motion: reduce) {
      .back-to-top { transition: none; }
    }
  `]
})
export class BackToTopComponent implements OnDestroy {
  visible = signal(false);
  private listener = () => this.onScroll();

  constructor() {
    window.addEventListener('scroll', this.listener, { passive: true });
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.listener);
  }

  private onScroll() {
    this.visible.set(window.scrollY > 400);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
