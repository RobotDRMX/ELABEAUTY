import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Lang = 'es' | 'en' | 'fr' | 'pt' | 'ja' | 'de' | 'ru' | 'ko';

export interface LangOption {
  code: Lang;
  label: string;
  flag: string;
}

export const LANGUAGES: LangOption[] = [
  { code: 'es', label: 'Español',    flag: '🇲🇽' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'ja', label: '日本語',      flag: '🇯��' },
  { code: 'de', label: 'Deutsch',    flag: '���🇪' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'ko', label: '한국어',      flag: '🇰����' },
];

@Injectable({ providedIn: 'root' })
export class I18nService {
  lang = signal<Lang>(this.getSavedLang());
  private translations: Record<string, string> = {};
  private loaded = signal(false);

  constructor(private http: HttpClient) {
    this.loadLang(this.lang());
  }

  private getSavedLang(): Lang {
    const saved = localStorage.getItem('ela-lang') as Lang | null;
    return saved && LANGUAGES.some(l => l.code === saved) ? saved : 'es';
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
    localStorage.setItem('ela-lang', lang);
    this.loadLang(lang);
  }

  private loadLang(lang: Lang) {
    this.http.get<Record<string, string>>(`assets/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this.translations = data;
        this.loaded.set(true);
      },
      error: () => {
        if (lang !== 'es') {
          this.http.get<Record<string, string>>('assets/i18n/es.json').subscribe({
            next: (data) => { this.translations = data; this.loaded.set(true); },
          });
        }
      },
    });
  }

  t(key: string, params?: Record<string, string | number>): string {
    let text = this.translations[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  }
}
