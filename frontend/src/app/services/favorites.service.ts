import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { NotificationService } from './notification.service';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
    private apiUrl = environment.apiBaseUrl + '/favorites';
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private router = inject(Router);
    private notif = inject(NotificationService);

    favorites = signal<any[]>([]);
    isLoading = signal(false);
    favoritesCount = computed(() => this.favorites().length);

    constructor() {
        if (this.authService.isAuthenticated()) {
            this.loadFavorites();
        }
    }

    loadFavorites() {
        if (!this.authService.isAuthenticated()) return;
        this.isLoading.set(true);
        this.http.get<any[]>(this.apiUrl).subscribe({
            next: (favs) => { this.favorites.set(favs); this.isLoading.set(false); },
            error: () => { this.favorites.set([]); this.isLoading.set(false); }
        });
    }

    toggleFavorite(productId: number) {
        if (!this.authService.isAuthenticated()) {
            this.notif.toast('Inicia sesión para guardar favoritos', 'warning');
            setTimeout(() => this.router.navigate(['/auth/login']), 1200);
            return;
        }
        const isFavorite = this.favorites().some(f => f.product.id === productId);
        if (isFavorite) {
            return this.http.delete(`${this.apiUrl}/${productId}`)
                .pipe(tap(() => {
                    this.loadFavorites();
                    this.notif.toast('Eliminado de favoritos', 'info', 2000);
                }))
                .subscribe({ error: () => this.notif.toast('Error al actualizar favoritos', 'error') });
        } else {
            return this.http.post(`${this.apiUrl}/${productId}`, {})
                .pipe(tap(() => {
                    this.loadFavorites();
                    this.notif.toast('Guardado en favoritos ♥', 'success', 2000);
                }))
                .subscribe({ error: () => this.notif.toast('Error al guardar favorito', 'error') });
        }
    }

    isFavorite(productId: number): boolean {
        return this.favorites().some(f => f.product.id === productId);
    }
}
