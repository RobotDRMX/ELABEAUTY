import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ThemeService, Theme, THEME_OPTIONS } from '../../services/theme.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SearchComponent, LucideAngularModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  authService    = inject(AuthService);
  cartService    = inject(CartService);
  favoritesService = inject(FavoritesService);
  router         = inject(Router);
  themeService   = inject(ThemeService);

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

  navItems = [
    { label: 'Catalog', link: '/busqueda', icon: 'grid-2x2' }, // Static string
    { label: 'Lipsticks', link: '/busqueda', queryParams: { category: 'Labiales' }, icon: 'heart' }, // Static string
    { label: 'Face', link: '/busqueda', queryParams: { category: 'Rostro' }, icon: 'palette' }, // Static string
    { label: 'Eyes', link: '/busqueda', queryParams: { category: 'Ojos' }, icon: 'eye' }, // Static string
    { label: 'Nails', link: '/busqueda', queryParams: { category: 'Uñas' }, icon: 'sparkles' }, // Static string
    { label: 'Hairstyles', link: '/peinados', icon: 'scissors' }, // Static string
    { label: 'Nail Designs', link: '/disenos-unas', icon: 'flower-2' }, // Static string
    { label: 'Offers', link: '/busqueda', queryParams: { sortBy: 'price', order: 'ASC' }, icon: 'tag' } // Static string
  ];

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
