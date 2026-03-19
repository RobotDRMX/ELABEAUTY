import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const API = 'http://localhost:3000/api/admin/products';

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  create(dto: any): Observable<any> {
    return this.http.post<any>(API, dto);
  }

  update(id: number, dto: any): Observable<any> {
    return this.http.patch<any>(`${API}/${id}`, dto);
  }

  deactivate(id: number): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/deactivate`, {});
  }

  restore(id: number): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/restore`, {});
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/${id}`);
  }
}
