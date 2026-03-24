import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  authService    = inject(AuthService);
  cartService    = inject(CartService);
  favoritesService = inject(FavoritesService);
  router         = inject(Router);
  themeService   = inject(ThemeService);

  readonly themeOptions: { value: Theme; label: string }[] = [
    { value: 'light',      label: 'Claro' },
    { value: 'dark',       label: 'Oscuro' },
    { value: 'colorblind', label: 'Daltonismo' },
  ];

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

  navItems = [
    { label: 'Catálogo', link: '/busqueda', icon: 'fas fa-th-large' },
    { label: 'Labiales', link: '/busqueda', queryParams: { category: 'Labiales' }, icon: 'fas fa-kiss-wink-heart' },
    { label: 'Rostro', link: '/busqueda', queryParams: { category: 'Rostro' }, icon: 'fas fa-palette' },
    { label: 'Ojos', link: '/busqueda', queryParams: { category: 'Ojos' }, icon: 'fas fa-eye' },
    { label: 'Uñas', link: '/busqueda', queryParams: { category: 'Uñas' }, icon: 'fas fa-hand-sparkles' },
    { label: 'Peinados', link: '/peinados', icon: 'fas fa-scissors' },
    { label: 'Diseños de Uñas', link: '/disenos-unas', icon: 'fas fa-spa' },
    { label: 'Ofertas', link: '/busqueda', queryParams: { sortBy: 'price', order: 'ASC' }, icon: 'fas fa-tag' }
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
