import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResult } from './admin-products.service';

const API = 'http://localhost:3000/api/admin/users';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);

  findAll(page: number, limit: number, showInactive: boolean): Observable<PagedResult<any>> {
    const params = new HttpParams()
      .set('page', page).set('limit', limit).set('showInactive', showInactive);
    return this.http.get<PagedResult<any>>(API, { params });
  }

  updateRole(id: number, role: string): Observable<any> {
    return this.http.patch<any>(`${API}/${id}/role`, { role });
  }

  deactivate(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API}/${id}/deactivate`, {});
  }

  restore(id: number): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${API}/${id}/restore`, {});
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/${id}`);
  }
}
