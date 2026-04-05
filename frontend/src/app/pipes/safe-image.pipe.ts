import { Pipe, PipeTransform } from '@angular/core';

const SAFE_PROTOCOLS = ['http:', 'https:'];
const DEFAULT_PLACEHOLDER = 'assets/images/product-placeholder.jpg';

/**
 * Validates image URLs to prevent javascript: and data: protocol injection.
 * Returns a safe placeholder if the URL is malicious or malformed.
 *
 * Usage: <img [src]="url | safeImage" />
 *        <img [src]="url | safeImage:'assets/images/custom-placeholder.jpg'" />
 */
@Pipe({ name: 'safeImage', standalone: true })
export class SafeImagePipe implements PipeTransform {
  transform(url: string | null | undefined, placeholder: string = DEFAULT_PLACEHOLDER): string {
    if (!url) return placeholder;

    // Allow relative paths (assets/, /, ./)
    if (url.startsWith('assets/') || url.startsWith('/') || url.startsWith('./')) {
      return url;
    }

    try {
      const parsed = new URL(url);
      return SAFE_PROTOCOLS.includes(parsed.protocol) ? url : placeholder;
    } catch {
      return placeholder;
    }
  }
}
