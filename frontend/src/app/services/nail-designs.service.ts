import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NailDesign {
  id: number;
  name: string;
  description: string;
  process: string;
  duration?: string;
  price?: number;
  style?: string;
  image_url?: string;
  is_available: boolean;
}

@Injectable({ providedIn: 'root' })
export class NailDesignsService {
  private readonly apiUrl = environment.apiBaseUrl + '/nail-designs';
  private http = inject(HttpClient);

  getAll(style?: string): Observable<NailDesign[]> {
    let params = new HttpParams();
    if (style) params = params.set('style', style);
    return this.http.get<NailDesign[]>(this.apiUrl, { params });
  }

  getOne(id: number): Observable<NailDesign> {
    return this.http.get<NailDesign>(`${this.apiUrl}/${id}`);
  }
}
