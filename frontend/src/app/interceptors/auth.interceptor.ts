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

let isRefreshing = false;
let refreshSubject = new Subject<boolean>();

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
        !req.url.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          // Otro request ya está haciendo refresh — esperar y reintentar
          return refreshSubject.pipe(
            take(1),
            switchMap(() => next(reqWithCredentials)),
          );
        }

        isRefreshing = true;
        refreshSubject = new Subject<boolean>();
        const http = inject(HttpClient);
        const router = inject(Router);

        return http
          .post(
            `${environment.apiBaseUrl}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .pipe(
            switchMap(() => {
              isRefreshing = false;
              refreshSubject.next(true);
              refreshSubject.complete();
              return next(reqWithCredentials);
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
