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
  { code: 'ja', label: '日本語',      flag: '🇯🇵' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'ko', label: '한국어',      flag: '🇰🇷' },
];

@Injectable({ providedIn: 'root' })
export class I18nService {
  lang = signal<Lang>(this.getSavedLang());
  private translations: Record<string, string> = {};
  /** Se incrementa cada vez que se carga un idioma; obliga al TranslatePipe (pure: false) a re-evaluarse. */
  private loaded = signal(0);

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

  /**
   * Construye la URL absoluta del JSON de idioma.
   * Usa document.baseURI para obtener la raíz real del sitio,
   * evitando que rutas localizadas como /es/carrito/ rompan la carga.
   */
  private resolveAssetUrl(lang: Lang): string {
    // document.baseURI ej: "https://mi-app.vercel.app/" o "http://localhost:4200/"
    const base = document.baseURI.endsWith('/') ? document.baseURI : document.baseURI + '/';
    return `${base}assets/i18n/${lang}.json`;
  }

  private loadLang(lang: Lang) {
    const url = this.resolveAssetUrl(lang);
    this.http.get<Record<string, string>>(url).subscribe({
      next: (data) => {
        this.translations = data;
        this.loaded.update(v => v + 1);
      },
      error: () => {
        if (lang !== 'es') {
          // Fallback a español
          this.http.get<Record<string, string>>(this.resolveAssetUrl('es')).subscribe({
            next: (data) => {
              this.translations = data;
              this.loaded.update(v => v + 1);
            },
          });
        }
      },
    });
  }

  t(key: string, params?: Record<string, string | number>): string {
    // Leer loaded() para que el pipe detecte el cambio de señal
    this.loaded();
    let text = this.translations[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  }
}
