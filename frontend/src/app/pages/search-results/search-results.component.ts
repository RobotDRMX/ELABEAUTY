import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product, SearchParams } from '../../interfaces/product.interface';
import { SearchComponent } from '../../components/search/search.component';
import { TruncatePipe } from '../../pipes/truncate.pipe';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchComponent, TruncatePipe],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  products: Product[] = [];
  query: string = '';
  category: string = '';
  total: number = 0;
  page: number = 1;
  limit: number = 12;
  totalPages: number = 0;
  isLoading: boolean = true;
  error: string = '';
  
  filters = {
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    order: 'DESC'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      this.category = params['category'] || '';
      this.page = parseInt(params['page']) || 1;
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
      order: this.filters.order as 'ASC' | 'DESC'
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

  applyFilters() {
    this.page = 1;
    this.updateUrl();
  }

  clearFilters() {
    this.filters = {
      minPrice: '',
      maxPrice: '',
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

  // Método que faltaba
  addToCart(product: Product) {
    console.log('Añadiendo al carrito:', product);
    // TODO: Implementar lógica del carrito
    alert(`Producto "${product.name}" añadido al carrito`);
  }

  updateUrl() {
    const queryParams: any = {};
    
    if (this.query) queryParams.q = this.query;
    if (this.category) queryParams.category = this.category;
    if (this.page > 1) queryParams.page = this.page;
    if (this.filters.minPrice) queryParams.minPrice = this.filters.minPrice;
    if (this.filters.maxPrice) queryParams.maxPrice = this.filters.maxPrice;
    if (this.filters.sortBy !== 'created_at') queryParams.sortBy = this.filters.sortBy;
    if (this.filters.order !== 'DESC') queryParams.order = this.filters.order;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
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
