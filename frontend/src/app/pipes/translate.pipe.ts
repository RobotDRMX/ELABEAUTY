import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

/**
 * TranslatePipe — resolves i18n keys from the active language JSON.
 * Usage: {{ 'cart.title' | translate }}
 * With params: {{ 'cart.items_count' | translate:{ count: 3 } }}
 *
 * Pure: false so it re-evaluates whenever the active language changes.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
