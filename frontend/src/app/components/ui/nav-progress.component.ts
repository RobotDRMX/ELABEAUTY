import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-nav-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nav-progress-bar" [class.active]="loading()" [class.complete]="completing()"></div>
  `,
  styles: [`
    .nav-progress-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      width: 0%;
      z-index: 99999;
      background: linear-gradient(90deg, var(--primary-color, #e6007e), var(--primary-light, #ff4da6));
      box-shadow: 0 0 8px rgba(230, 0, 126, 0.6);
      transition: width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      border-radius: 0 2px 2px 0;
      pointer-events: none;

      &.active   { width: 70%; }
      &.complete { width: 100%; opacity: 0; transition: width 0.25s ease, opacity 0.35s ease 0.2s; }
    }
  `]
})
export class NavProgressComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private sub!: Subscription;

  loading   = signal(false);
  completing = signal(false);

  ngOnInit() {
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.completing.set(false);
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.set(false);
        this.completing.set(true);
        setTimeout(() => this.completing.set(false), 600);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
