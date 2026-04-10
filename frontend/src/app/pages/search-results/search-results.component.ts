import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { Product, SearchParams } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { RealtimeService } from '../../services/realtime.service';
import { SearchComponent } from '../../components/search/search.component';
import { TruncatePipe } from '../../pipes/truncate.pipe';
import { SafeImagePipe } from '../../pipes/safe-image.pipe';
import { LucideIcons } from '../../icons.provider';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchComponent, TruncatePipe, SafeImagePipe, LucideIcons],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private realtime = inject(RealtimeService);
  private realtimeSub?: Subscription;

  products: Product[] = [];
  query: string = '';
  category: string = '';
  total: number = 0;
  page: number = 1;
  limit: number = 12;
  totalPages: number = 0;
  isLoading: boolean = true;
  error: string = '';

  drawerOpen = signal(false);
  addingToCart = signal<Set<number>>(new Set());
  togglingFavorite = signal<Set<number>>(new Set());
  justAdded = signal<Set<number>>(new Set());

  ageOptions: string[] = ['Adolescentes', 'Jóvenes', 'Adultos', 'Todas'];

  filters = {
    minPrice: '',
    maxPrice: '',
    onlyInStock: false,
    targetAge: '',
    sortBy: 'created_at',
    order: 'DESC'
  };

  get activeFilterCount(): number {
    let count = 0;
    if (this.filters.onlyInStock) count++;
    if (this.filters.targetAge) count++;
    if (this.filters.minPrice) count++;
    if (this.filters.maxPrice) count++;
    return count;
  }

  get emptyReason(): 'text' | 'price' | 'category+text' | 'stock' | 'generic' {
    const hasText = !!this.query;
    const hasCategory = !!this.category;
    const hasPrice = !!(this.filters.minPrice || this.filters.maxPrice);
    const hasStock = !!this.filters.onlyInStock;

    if (hasCategory && hasText) return 'category+text';
    if (hasText) return 'text';
    if (hasPrice) return 'price';
    if (hasStock) return 'stock';
    return 'generic';
  }

  ngOnInit() {
    this.realtimeSub = this.realtime.on('products:updated').subscribe(() => {
      this.loadProducts();
    });

    this.route.queryParams.subscribe(params => {
      this.query = this.sanitizeString(params['q']);
      this.category = this.sanitizeString(params['category']);
      this.page = Math.max(1, parseInt(params['page']) || 1);

      this.filters.minPrice = this.sanitizeNumeric(params['minPrice']);
      this.filters.maxPrice = this.sanitizeNumeric(params['maxPrice']);
      this.filters.onlyInStock = params['onlyInStock'] === 'true';
      this.filters.targetAge = this.ageOptions.includes(params['targetAge']) ? params['targetAge'] : '';
      this.filters.sortBy = ['created_at', 'price', 'name', 'rating'].includes(params['sortBy']) ? params['sortBy'] : 'created_at';
      this.filters.order = params['order'] === 'ASC' ? 'ASC' : 'DESC';

      this.loadProducts();
    });
  }

  loadProducts() {
    this.isLoading = true;
    this.error = '';

    const searchParams: SearchParams = {
      query: this.query,
      category: this.category,
      page: this.page,
      limit: this.limit,
      sortBy: this.filters.sortBy,
      order: this.filters.order as 'ASC' | 'DESC',
      onlyInStock: this.filters.onlyInStock,
      targetAge: this.filters.targetAge || undefined
    };

    if (this.filters.minPrice) {
      searchParams.minPrice = parseFloat(this.filters.minPrice);
    }

    if (this.filters.maxPrice) {
      searchParams.maxPrice = parseFloat(this.filters.maxPrice);
    }

    this.productService.searchProducts(searchParams).subscribe({
      next: (response) => {
        this.products = response.products;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Error al cargar los productos. Por favor intenta nuevamente.';
        this.isLoading = false;
      }
    });
  }

  toggleFavorite(product: Product) {
    if (this.togglingFavorite().has(product.id)) return;
    this.togglingFavorite.update(s => new Set([...s, product.id]));
    this.favoritesService.toggleFavorite(product.id);
    setTimeout(() => {
      this.togglingFavorite.update(s => { const n = new Set(s); n.delete(product.id); return n; });
    }, 800);
  }

  isFavorite(productId: number): boolean {
    return this.favoritesService.isFavorite(productId);
  }

  addToCart(product: Product) {
    if (this.addingToCart().has(product.id)) return;
    this.addingToCart.update(s => new Set([...s, product.id]));
    this.cartService.addToCart(product.id);
    setTimeout(() => {
      this.addingToCart.update(s => { const n = new Set(s); n.delete(product.id); return n; });
      this.justAdded.update(s => new Set([...s, product.id]));
      setTimeout(() => {
        this.justAdded.update(s => { const n = new Set(s); n.delete(product.id); return n; });
      }, 1500);
    }, 700);
  }

  applyFilters() {
    this.page = 1;
    this.updateUrl();
  }

  clearFilters() {
    this.filters = {
      minPrice: '',
      maxPrice: '',
      onlyInStock: false,
      targetAge: '',
      sortBy: 'created_at',
      order: 'DESC'
    };
    this.applyFilters();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.updateUrl();
      window.scrollTo(0, 0);
    }
  }

  updateUrl() {
    const queryParams: any = {};

    if (this.query) queryParams.q = this.query;
    if (this.category) queryParams.category = this.category;
    if (this.page > 1) queryParams.page = this.page;
    if (this.filters.minPrice) queryParams.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice) queryParams.maxPrice = this.filters.maxPrice;
    if (this.filters.onlyInStock) queryParams.onlyInStock = true;
    if (this.filters.targetAge) queryParams.targetAge = this.filters.targetAge;
    if (this.filters.sortBy !== 'created_at') queryParams.sortBy = this.filters.sortBy;
    if (this.filters.order !== 'DESC') queryParams.order = this.filters.order;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    this.realtimeSub?.unsubscribe();
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/product-placeholder.jpg';
  }

  private sanitizeString(value: string | undefined): string {
    if (!value) return '';
    // Strip HTML tags and limit length
    return value.replace(/<[^>]*>/g, '').substring(0, 200);
  }

  private sanitizeNumeric(value: string | undefined): string {
    if (!value) return '';
    const num = parseFloat(value);
    return isNaN(num) || num < 0 ? '' : num.toString();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, this.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
