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

  // In-memory token — never persisted to localStorage/sessionStorage
  private _accessToken: string | null = null;

  get accessToken(): string | null {
    return this._accessToken;
  }

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  private checkSession() {
    // Try refreshing the token on startup (refresh_token is in HttpOnly cookie)
    this.http
      .post<{ access_token: string }>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .subscribe({
        next: (res) => {
          this._accessToken = res.access_token;
          // Now fetch profile with the new token
          this.http
            .get(`${this.apiUrl}/profile`)
            .subscribe({
              next: (user: any) => {
                this.currentUser.set(user);
                this.isAuthenticated.set(true);
              },
              error: () => this.clearState(),
            });
        },
        error: () => this.clearState(),
      });
  }

  login(credentials: any): Observable<any> {
    return this.http
      .post<{ user: any; access_token: string }>(`${this.apiUrl}/login`, credentials, { withCredentials: true })
      .pipe(
        tap((res) => {
          this._accessToken = res.access_token;
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
        }),
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData, {
      withCredentials: true,
    });
  }

  logout() {
    this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({
        next: () => this.clearStateAndRedirect(),
        error: () => this.clearStateAndRedirect(),
      });
  }

  /** Called by interceptor to perform a token refresh */
  refreshToken(): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(
      `${this.apiUrl}/refresh`,
      {},
      { withCredentials: true },
    );
  }

  /** Called by interceptor after a successful token refresh */
  setAccessToken(token: string) {
    this._accessToken = token;
  }

  getProfile(): Observable<any> {
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

  /** Limpia el estado en memoria. No redirige. Usado por el interceptor y checkSession. */
  clearState() {
    this._accessToken = null;
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  clearStateAndRedirect() {
    this.clearState();
    this.router.navigate(['/auth/login']);
  }
}
