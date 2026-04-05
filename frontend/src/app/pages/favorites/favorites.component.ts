import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { CartService } from '../../services/cart.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { LucideIcons } from '../../icons.provider';

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule, TruncatePipe, LucideIcons],
    templateUrl: './favorites.component.html',
    styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent {
    favoritesService = inject(FavoritesService);
    cartService = inject(CartService);

    get favorites() {
        return this.favoritesService.favorites();
    }

    removeFavorite(productId: number) {
        this.favoritesService.toggleFavorite(productId);
    }

    addToCart(product: any) {
        this.cartService.addToCart(product.id);
    }
}
