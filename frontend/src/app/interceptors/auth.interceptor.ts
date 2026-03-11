import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // Agregar withCredentials a todas las peticiones
  const reqWithCredentials = req.clone({ withCredentials: true });

  return next(reqWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      // Solo intentar refresh si es 401 y no es un endpoint de auth
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register') &&
        !req.url.includes('/auth/refresh') &&
        !isRefreshing
      ) {
        isRefreshing = true;
        const http = inject(HttpClient);
        const router = inject(Router);

        return http
          .post(
            'http://localhost:3000/api/auth/refresh',
            {},
            { withCredentials: true },
          )
          .pipe(
            switchMap(() => {
              isRefreshing = false;
              return next(reqWithCredentials);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
