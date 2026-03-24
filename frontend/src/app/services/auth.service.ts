import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl + '/auth';

  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  private checkSession() {
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
    // Limpiar cookies en el servidor, luego redirigir
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          sessionStorage.removeItem('user');
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          // Limpiar estado local aunque el servidor falle
          sessionStorage.removeItem('user');
          this.currentUser.set(null);
          this.isAuthenticated.set(false);
          this.router.navigate(['/auth/login']);
        },
      });
  }

  getProfile(): Observable<any> {
    // withCredentials lo agrega el interceptor automáticamente
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profile/update`, data);
  }

  verifyEmail(token_hash: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar-correo`, { token_hash, type: 'email' });
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/olvide-contrasena`, { email });
  }

  resetPassword(token_hash: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/nueva-contrasena`, { token_hash, newPassword });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reenviar-verificacion`, { email });
  }
}
