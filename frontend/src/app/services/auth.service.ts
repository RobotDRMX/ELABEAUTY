import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  private checkSession() {
    // Verificar sesión activa consultando al backend (usa cookie automáticamente)
    this.http
      .get(`${this.apiUrl}/profile`, { withCredentials: true })
      .subscribe({
        next: (user: any) => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          sessionStorage.setItem('user', JSON.stringify(user));
        },
        error: () => {
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          sessionStorage.removeItem('user');
        },
      });
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res: any) => {
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
          sessionStorage.setItem('user', JSON.stringify(res.user));
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true,
    });
  }

  logout() {
    // Limpiar cookies en el servidor
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe();
    sessionStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  getProfile(): Observable<any> {
    // withCredentials lo agrega el interceptor automáticamente
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/update`, data);
  }
}
