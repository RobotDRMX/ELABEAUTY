import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, SearchResponse, SearchParams } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:3000/api/products';

  constructor(private http: HttpClient) {}

  searchProducts(params: SearchParams): Observable<SearchResponse> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params: httpParams });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/featured`, {
      params: new HttpParams().set('limit', limit.toString())
    });
  }

  seedProducts(): Observable<any> {
    return this.http.post(`${this.apiUrl}/seed`, {});
  }

  // Método para realizar búsqueda rápida (autocomplete)
  quickSearch(query: string, limit: number = 5): Observable<Product[]> {
    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, {
      params: new HttpParams()
        .set('query', query)
        .set('limit', limit.toString())
        .set('page', '1')
    }).pipe(
      map((response: SearchResponse) => response.products)
    );
  }
}
