import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
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
      // Handle 401 specifically for the refresh token endpoint failure
      if (error.status === 401 && req.url.includes('/auth/refresh')) {
        console.error('Token refresh failed with 401. Logging out user.');
        authService.clearStateAndRedirect(); // Ensure user is logged out and redirected
        return throwError(() => new Error('Token refresh failed and user is logged out.'));
      }

      // Handle 401 errors for other protected resources
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
        // No need to exclude /auth/refresh here as it's handled above
      ) {
        if (isRefreshing) {
          // If a refresh is already in progress, wait for the new token
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) => {
              const retried = req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${newToken}` },
              });
              return next(retried);
            }),
            catchError((errAfterRefresh) => {
              // If even retrying with new token fails, log out
              console.error('Request failed after token refresh attempt. Logging out user.');
              authService.clearStateAndRedirect();
              return throwError(() => new Error('Authentication failed after refresh.'));
            })
          );
        }

        // If no refresh is in progress, attempt to refresh the token
        isRefreshing = true;
        refreshSubject = new Subject<string>(); // Reset subject for new refresh process

        return authService.refreshToken().pipe(
          switchMap((res) => {
            authService.setAccessToken(res.access_token);
            refreshSubject.next(res.access_token);
            refreshSubject.complete();
            isRefreshing = false;

            const retried = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${res.access_token}` },
            });
            return next(retried);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshSubject.error(refreshError);
            console.error('Token refresh attempt failed. Logging out user.');
            authService.clearStateAndRedirect(); // Ensure user is logged out and redirected
            return throwError(() => new Error('Token refresh failed.'));
          })
        );
      }

      // For errors other than 401, or if it's a 401 on login/register (which shouldn't happen as usually handled by form validation)
      return throwError(() => error);
    })
    );
    };
