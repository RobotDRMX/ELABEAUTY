import { Component, inject, signal } from '@angular/core';
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

    removingId = signal<number | null>(null);
    addingToCartId = signal<number | null>(null);
    justAdded = signal<Set<number>>(new Set());

    get favorites() {
        return this.favoritesService.favorites();
    }

    get isLoading() {
        return this.favoritesService.isLoading();
    }

    removeFavorite(productId: number) {
        if (this.removingId() === productId) return;
        this.removingId.set(productId);
        this.favoritesService.toggleFavorite(productId);
        setTimeout(() => this.removingId.set(null), 800);
    }

    addToCart(product: any) {
        if (this.addingToCartId() === product.id) return;
        this.addingToCartId.set(product.id);
        this.cartService.addToCart(product.id);
        setTimeout(() => {
            this.addingToCartId.set(null);
            this.justAdded.update(s => new Set([...s, product.id]));
            setTimeout(() => {
                this.justAdded.update(s => { const n = new Set(s); n.delete(product.id); return n; });
            }, 1500);
        }, 700);
    }
}
