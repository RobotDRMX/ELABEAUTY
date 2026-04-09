import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, TranslatePipe],
  template: `
    <div class="not-found-page">
      <lucide-icon name="file-question" [size]="80"></lucide-icon>
      <h1>{{ 'notfound.title' | translate }}</h1>
      <p>{{ 'notfound.subtitle' | translate }}</p>
      <a routerLink="/" class="btn-primary">{{ 'notfound.back_home' | translate }}</a>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      text-align: center;
      padding: 4rem 1rem;
      color: var(--text-secondary);

      lucide-icon { opacity: 0.4; }

      h1 {
        font-family: var(--font-heading);
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
        margin: 0;
      }

      p {
        font-size: 1rem;
        max-width: 400px;
        margin: 0;
      }
    }
  `]
})
export class NotFoundComponent {}
