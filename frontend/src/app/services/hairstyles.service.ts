import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Hairstyle {
  id: number;
  name: string;
  description: string;
  process: string;
  duration?: string;
  price?: number;
  category?: string;
  image_url?: string;
  is_available: boolean;
}

@Injectable({ providedIn: 'root' })
export class HairstylesService {
  private readonly apiUrl = environment.apiBaseUrl + '/hairstyles';
  private http = inject(HttpClient);

  getAll(category?: string): Observable<Hairstyle[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<Hairstyle[]>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<Hairstyle> {
    return this.http.get<Hairstyle>(`${this.apiUrl}/${id}`);
  }
}
