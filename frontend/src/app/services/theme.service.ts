import { Injectable, signal } from '@angular/core';

export type Theme =
  | 'light'
  | 'dark'
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly'
  | 'achromatopsia';

export interface ThemeOption {
  value: Theme;
  label: string;
  group: 'mode' | 'colorblind';
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light',          label: 'Claro',          group: 'mode' },
  { value: 'dark',           label: 'Oscuro',         group: 'mode' },
  { value: 'protanopia',     label: 'Protanopia',     group: 'colorblind' },
  { value: 'deuteranopia',   label: 'Deuteranopia',   group: 'colorblind' },
  { value: 'tritanopia',     label: 'Tritanopia',     group: 'colorblind' },
  { value: 'protanomaly',    label: 'Protanomaly',    group: 'colorblind' },
  { value: 'deuteranomaly',  label: 'Deuteranomaly',  group: 'colorblind' },
  { value: 'tritanomaly',    label: 'Tritanomaly',    group: 'colorblind' },
  { value: 'achromatopsia',  label: 'Achromatopsia',  group: 'colorblind' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.getSavedTheme());

  constructor() {
    this.apply(this.theme());
  }

  private getSavedTheme(): Theme {
    const saved = localStorage.getItem('ela-theme') as Theme | null;
    return saved && THEME_OPTIONS.some(t => t.value === saved) ? saved : 'light';
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
