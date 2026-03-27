import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, switchMap, take, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);

  // Clone with credentials (for refresh_token cookie) and Authorization header
  let cloned = req.clone({ withCredentials: true });

  const token = authService.accessToken;
  if (token) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) => {
              const retried = req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retried);
            }),
          );
        }

        isRefreshing = true;
        refreshSubject = new Subject<string>();
        const http = inject(HttpClient);
        const router = inject(Router);

        return http
          .post<{ access_token: string }>(
            `${environment.apiBaseUrl}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .pipe(
            switchMap((res) => {
              isRefreshing = false;
              authService.setAccessToken(res.access_token);
              refreshSubject.next(res.access_token);
              refreshSubject.complete();
              const retried = req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${res.access_token}` },
              });
              return next(retried);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshSubject.error(refreshError);
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
