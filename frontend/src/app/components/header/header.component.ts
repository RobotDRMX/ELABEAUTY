import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ThemeService, THEME_OPTIONS } from '../../services/theme.service';
import { I18nService, Lang } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchComponent, LucideAngularModule, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  authService    = inject(AuthService);
  cartService    = inject(CartService);
  favoritesService = inject(FavoritesService);
  router         = inject(Router);
  themeService   = inject(ThemeService);
  i18n           = inject(I18nService);

  readonly modeThemes = THEME_OPTIONS.filter(t => t.group === 'mode');
  readonly a11yThemes = THEME_OPTIONS.filter(t => t.group === 'colorblind');

  get isA11yTheme(): boolean {
    return this.a11yThemes.some(t => t.value === this.themeService.theme());
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  get userName(): string {
    return this.authService.currentUser()?.firstName || 'Usuario';
  }

  logout() {
    this.authService.logout();
  }

  get cartItemCount(): number {
    return this.cartService.itemCount();
  }

  get favoritesCount(): number {
    return this.favoritesService.favoritesCount();
  }

  mobileMenuOpen = signal(false);

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  // ── Language switcher (I18n nativo) ──────────────────────────────────────
  get currentLocale(): string {
    return this.i18n.lang();
  }

  readonly languages = [
    { code: 'es' as Lang, label: 'ES', name: 'Español' },
    { code: 'en' as Lang, label: 'EN', name: 'English' },
    { code: 'de' as Lang, label: 'DE', name: 'Deutsch' },
    { code: 'fr' as Lang, label: 'FR', name: 'Français' },
    { code: 'ja' as Lang, label: 'JA', name: '日本語' },
    { code: 'ko' as Lang, label: 'KO', name: '한국어' },
    { code: 'pt' as Lang, label: 'PT', name: 'Português' },
    { code: 'ru' as Lang, label: 'RU', name: 'Русский' },
  ];

  switchLanguage(locale: string): void {
    this.i18n.setLang(locale as Lang);
  }

  /** navItems como computed signal: se recalcula automáticamente al cambiar el idioma */
  navItems = computed(() => [
    { label: this.i18n.t('nav.catalog'),      link: '/busqueda', icon: 'grid-2x2' },
    { label: this.i18n.t('nav.lips'),         link: '/busqueda', queryParams: { category: 'Labiales' }, icon: 'heart' },
    { label: this.i18n.t('nav.face'),         link: '/busqueda', queryParams: { category: 'Rostro' }, icon: 'palette' },
    { label: this.i18n.t('nav.eyes'),         link: '/busqueda', queryParams: { category: 'Ojos' }, icon: 'eye' },
    { label: this.i18n.t('nav.nails'),        link: '/busqueda', queryParams: { category: 'Uñas' }, icon: 'sparkles' },
    { label: this.i18n.t('nav.hairstyles'),   link: '/peinados', icon: 'scissors' },
    { label: this.i18n.t('nav.nail_designs'), link: '/disenos-unas', icon: 'flower-2' },
    { label: this.i18n.t('nav.offers'),       link: '/busqueda', queryParams: { sortBy: 'price', order: 'ASC' }, icon: 'tag' },
  ]);

  onSearch(searchTerm: string) {
    if (searchTerm.trim()) {
      this.router.navigate(['/busqueda'], { queryParams: { q: searchTerm } });
    }
  }

  openCart() {
    if (this.isLoggedIn) {
      this.router.navigate(['/carrito']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  openFavorites() {
    if (this.isLoggedIn) {
      this.router.navigate(['/favoritos']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  openAccount() {
    if (this.isLoggedIn) {
      this.router.navigate(['/perfil']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
