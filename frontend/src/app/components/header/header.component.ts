import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SearchComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  // Contador de items en el carrito
  cartItemCount: number = 3;
  
  // Contador de favoritos
  favoritesCount: number = 5;

  // Menú de navegación con iconos
  navItems = [
    { label: 'Labiales', link: '/labiales', icon: 'fas fa-kiss-wink-heart' },
    { label: 'Rostro', link: '/rostro', icon: 'fas fa-palette' },
    { label: 'Ojos', link: '/ojos', icon: 'fas fa-eye' },
    { label: 'Uñas', link: '/unas', icon: 'fas fa-hand-sparkles' },
    { label: 'Ofertas', link: '/ofertas', icon: 'fas fa-tag' },
    { label: 'Nuevo', link: '/nuevo', icon: 'fas fa-star' }
  ];

  // Método para búsqueda
  onSearch(searchTerm: string) {
    if (searchTerm.trim()) {
      console.log('Buscando productos:', searchTerm);
      // TODO: Implementar lógica de búsqueda real
    }
  }

  // Método para abrir el carrito
  openCart() {
    console.log('Abrir carrito de compras');
    // TODO: Implementar modal/drawer del carrito
  }

  // Método para abrir favoritos
  openFavorites() {
    console.log('Abrir lista de favoritos');
    // TODO: Implementar página de favoritos
  }

  // Método para abrir cuenta de usuario
  openAccount() {
    console.log('Abrir cuenta de usuario');
    // TODO: Implementar login/modal de cuenta
  }
}
