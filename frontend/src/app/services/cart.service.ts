import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CartService {
    private apiUrl = environment.apiBaseUrl + '/cart';
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private router = inject(Router);
    private notif = inject(NotificationService);

    cart = signal<any>(null);

    itemCount = computed(() => {
        const c = this.cart();
        if (!c?.items) return 0;
        return c.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
    });

    totalPrice = computed(() => {
        const c = this.cart();
        if (!c?.items) return 0;
        return c.items.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
    });

    constructor() {
        if (this.authService.isAuthenticated()) {
            this.loadCart();
        }
    }

    loadCart() {
        if (!this.authService.isAuthenticated()) return;
        this.http.get(this.apiUrl).subscribe({
            next: (cart) => this.cart.set(cart),
            error: () => this.cart.set(null)
        });
    }

    addToCart(productId: number, quantity: number = 1) {
        if (!this.authService.isAuthenticated()) {
            this.notif.toast('Inicia sesión para añadir productos al carrito', 'warning');
            setTimeout(() => this.router.navigate(['/auth/login']), 1200);
            return;
        }
        return this.http.post(`${this.apiUrl}/items`, { productId, quantity })
            .pipe(tap(() => {
                this.loadCart();
                this.notif.toast('Producto añadido al carrito ✓', 'success', 2500);
            }))
            .subscribe({ error: () => this.notif.toast('No se pudo añadir el producto', 'error') });
    }

    updateQuantity(productId: number, quantity: number) {
        return this.http.patch(`${this.apiUrl}/items/${productId}`, { quantity })
            .pipe(tap(() => this.loadCart()))
            .subscribe({ error: () => this.notif.toast('Error al actualizar cantidad', 'error') });
    }

    removeItem(productId: number) {
        return this.http.delete(`${this.apiUrl}/items/${productId}`)
            .pipe(tap(() => {
                this.loadCart();
                this.notif.toast('Producto eliminado del carrito', 'info', 2000);
            }))
            .subscribe({ error: () => this.notif.toast('Error al eliminar el producto', 'error') });
    }

    clearCart() {
        return this.http.delete(this.apiUrl)
            .pipe(tap(() => this.cart.set(null)))
            .subscribe({ error: () => this.notif.toast('Error al vaciar el carrito', 'error') });
    }
}
