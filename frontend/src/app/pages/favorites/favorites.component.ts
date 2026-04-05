import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { CartService } from '../../services/cart.service';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { LucideIcons } from '../../icons.provider';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-favorites',
    standalone: true,
    imports: [CommonModule, RouterModule, TruncatePipe, LucideIcons, TranslatePipe],
    templateUrl: './favorites.component.html',
    styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent {
    favoritesService = inject(FavoritesService);
    cartService = inject(CartService);

    get favorites() {
        return this.favoritesService.favorites();
    }

    get isLoading() {
        return this.favoritesService.isLoading();
    }

    removeFavorite(productId: number) {
        this.favoritesService.toggleFavorite(productId);
    }

    addToCart(product: any) {
        this.cartService.addToCart(product.id);
    }
}
