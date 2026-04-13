import { ApplicationConfig, importProvidersFrom, provideNoopZone } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TitleStrategy } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { csrfInterceptor } from './interceptors/csrf.interceptor';
import { LucideIconsModule } from './icons.provider';
import { I18nTitleStrategy } from './services/i18n-title.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // provideClientHydration(),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([csrfInterceptor, authInterceptor]),
    ),
    importProvidersFrom(LucideIconsModule),
    { provide: TitleStrategy, useClass: I18nTitleStrategy },
    provideNoopZone(), // Añadir esta línea para forzar NoopNgZone
  ],
};
