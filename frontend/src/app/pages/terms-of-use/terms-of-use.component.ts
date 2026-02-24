import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-of-use.component.html',
  styles: [`
    .terms-container {
      padding: 4rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
      line-height: 1.8;
      color: var(--text-primary);
    }
    .terms-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    .intro-box {
      background: var(--gray-100);
      padding: 2rem;
      border-left: 5px solid var(--primary-color);
      border-radius: 8px;
      margin-top: 2rem;
      text-align: left;
    }
    h1 {
      color: var(--primary-color);
      font-size: 3rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    h2 {
      color: var(--secondary-color);
      margin-top: 3rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid var(--gray-200);
      padding-bottom: 0.5rem;
      font-size: 1.5rem;
    }
    p {
      margin-bottom: 1.2rem;
      color: var(--text-secondary);
    }
    ul {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
      color: var(--text-secondary);
    }
    li {
      margin-bottom: 0.5rem;
    }
    .last-updated {
      font-style: italic;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .contact-card {
      background: #fdf2f8; /* Muy sutil rosa */
      padding: 2rem;
      border-radius: 12px;
      border: 1px dashed var(--primary-color);
      margin-top: 1.5rem;
    }
    .contact-card p {
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .contact-card strong {
      color: var(--primary-color);
      display: inline-block;
      width: 150px;
    }
  `]
})
export class TermsOfUseComponent { }
