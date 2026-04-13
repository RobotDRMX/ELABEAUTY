import { Injectable, signal, effect, Renderer2, inject, RendererFactory2 } from '@angular/core';

export type Theme = 'light' | 'dark';
export type ThemeType = Theme | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'protanomaly' | 'deuteranomaly' | 'tritanomaly' | 'achromatopsia';
export type ThemeGroup = 'mode' | 'colorblind';

export interface ThemeOption {
  value: ThemeType;
  label: string;
  group: ThemeGroup;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Claro', group: 'mode' },
  { value: 'dark', label: 'Oscuro', group: 'mode' },
  { value: 'protanopia', label: 'Protanopia', group: 'colorblind' },
  { value: 'deuteranopia', label: 'Deuteranopia', group: 'colorblind' },
  { value: 'tritanopia', label: 'Tritanopia', group: 'colorblind' },
  { value: 'protanomaly', label: 'Protanomalia', group: 'colorblind' },
  { value: 'deuteranomaly', label: 'Deuteranomalia', group: 'colorblind' },
  { value: 'tritanomaly', label: 'Tritanomalia', group: 'colorblind' },
  { value: 'achromatopsia', label: 'Acromatopsia', group: 'colorblind' },
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly theme = signal<ThemeType>(this.getInitialTheme()); // Renamed from currentTheme
  private renderer: Renderer2;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    effect(() => {
      const currentTheme = this.theme(); // Use this.theme()
      if (currentTheme === 'dark') {
        this.renderer.setAttribute(document.documentElement, 'data-theme', 'dark');
      } else if (THEME_OPTIONS.some(opt => opt.value === currentTheme && opt.group === 'colorblind')) {
        this.renderer.setAttribute(document.documentElement, 'data-theme', currentTheme);
      }
      else {
        this.renderer.removeAttribute(document.documentElement, 'data-theme');
      }
      localStorage.setItem('ela-theme', currentTheme);
    });
  }

  private getInitialTheme(): ThemeType {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('ela-theme') as ThemeType;
      if (savedTheme && THEME_OPTIONS.some(l => l.value === savedTheme)) {
        return savedTheme;
      }
      // Check for user's system preference for dark mode
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light'; // Default theme
  }

  toggleTheme(): void {
    // This is for light/dark toggle only, colorblind modes should be set specifically
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: ThemeType): void {
    this.theme.set(theme);
  }
}
