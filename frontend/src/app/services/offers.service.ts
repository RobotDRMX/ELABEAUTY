import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Offer } from '../interfaces/offer.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OffersService {
  private apiUrl = environment.apiBaseUrl + '/offers';

  constructor(private http: HttpClient) {}

  getActive(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiUrl}/active`);
  }
}
