import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark' | 'colorblind';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.getSavedTheme());

  constructor() {
    this.apply(this.theme());
  }

  private getSavedTheme(): Theme {
    return (localStorage.getItem('ela-theme') as Theme) ?? 'light';
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    localStorage.setItem('ela-theme', theme);
    this.apply(theme);
  }

  private apply(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
