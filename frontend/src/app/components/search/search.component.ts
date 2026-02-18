import { Component, OnInit, Output, EventEmitter, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../interfaces/product.interface';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, Subject } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;
  @Output() searchExecuted = new EventEmitter<string>();
  @Output() productSelected = new EventEmitter<Product>();

  searchControl = new FormControl('');
  searchResults: Product[] = [];
  showResults = false;
  isLoading = false;
  hasResults = false;
  noResults = false;

  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    this.setupSearch();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query && query.length >= 2) {
          this.isLoading = true;
          this.showResults = true;
          return this.productService.quickSearch(query).pipe(
            catchError(error => {
              console.error('Error en búsqueda:', error);
              return of([]);
            })
          );
        } else {
          this.searchResults = [];
          return of([]);
        }
      })
    ).subscribe({
      next: (products) => {
        this.searchResults = products;
        this.hasResults = products.length > 0;
        const queryValue = this.searchControl.value;
        this.noResults = products.length === 0 && !!queryValue && queryValue.length >= 2;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
        this.isLoading = false;
      }
    });

    // Escuchar cambios en el control
    this.searchControl.valueChanges.subscribe(value => {
      if (value !== null) {
        this.searchSubject.next(value);
      }
    });
  }

  onSearch() {
    const query = this.searchControl.value?.trim();
    if (query && query.length >= 2) {
      this.router.navigate(['/busqueda'], { 
        queryParams: { q: query } 
      });
      this.searchExecuted.emit(query);
      this.clearSearch();
    }
  }

  onSelectProduct(product: Product) {
    this.productSelected.emit(product);
    this.router.navigate(['/producto', product.id]);
    this.clearSearch();
  }

  onClear() {
    this.searchControl.setValue('');
    this.searchResults = [];
    this.showResults = false;
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  onFocus() {
    const value = this.searchControl.value;
    if (value && value.length >= 2) {
      this.showResults = true;
    }
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.searchResults = [];
    this.showResults = false;
    this.hasResults = false;
    this.noResults = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showResults = false;
    }
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
