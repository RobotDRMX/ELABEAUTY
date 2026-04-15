import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Subject, catchError, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshSubject = new Subject<string>();

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const authService = inject(AuthService);

  // Adjuntar credenciales (cookie refresh_token) y Bearer token si hay sesión activa
  let cloned = req.clone({ withCredentials: true });
  const token = authService.accessToken;
  if (token) {
    cloned = cloned.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      // ── 401 en el endpoint de refresh ────────────────────────────────────
      // No redirigir: esto ocurre en cada carga inicial cuando no hay sesión activa.
      // checkSession() maneja el error de forma silenciosa con clearState().
      // Redirigir aquí causaría que el usuario sea enviado a /auth/login al abrir
      // cualquier página pública de la app.
      if (error.status === 401 && req.url.includes('/auth/refresh')) {
        authService.clearState();
        return throwError(() => normalizeError(error));
      }

      // ── 401 en recursos protegidos (no es login ni register) ──────────────
      // Intentar refrescar el token y reintentar la petición original.
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/register')
      ) {
        if (isRefreshing) {
          // Esperar a que el refresco en curso termine y reintentar
          return refreshSubject.pipe(
            take(1),
            switchMap((newToken) =>
              next(
                req.clone({
                  withCredentials: true,
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                }),
              ),
            ),
            catchError((errAfterRefresh) => {
              authService.clearStateAndRedirect();
              return throwError(() => normalizeError(errAfterRefresh));
            }),
          );
        }

        isRefreshing = true;
        refreshSubject = new Subject<string>();

        return authService.refreshToken().pipe(
          switchMap((res) => {
            authService.setAccessToken(res.access_token);
            refreshSubject.next(res.access_token);
            refreshSubject.complete();
            isRefreshing = false;

            return next(
              req.clone({
                withCredentials: true,
                setHeaders: { Authorization: `Bearer ${res.access_token}` },
              }),
            );
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshSubject.error(refreshError);
            authService.clearStateAndRedirect();
            return throwError(() => normalizeError(refreshError));
          }),
        );
      }

      // ── Cualquier otro error ──────────────────────────────────────────────
      return throwError(() => normalizeError(error));
    }),
  );
};

/**
 * Normaliza errores HTTP para garantizar que los componentes siempre reciban
 * un objeto con `statusCode` y `message`, incluso si la respuesta del servidor
 * no era JSON válido (páginas HTML de error de Vercel/Koyeb/proxies).
 */
function normalizeError(error: HttpErrorResponse): HttpErrorResponse {
  if (!(error instanceof HttpErrorResponse)) return error;

  const body = error.error;

  // Si el cuerpo ya es un objeto con message, está bien
  if (body && typeof body === 'object' && 'message' in body) return error;

  // Si el cuerpo es un string (HTML de proxy) o un SyntaxError de parseo JSON,
  // reemplazarlo con un objeto JSON seguro
  const isBadBody =
    typeof body === 'string' ||
    body instanceof SyntaxError ||
    (body instanceof ProgressEvent);

  if (isBadBody) {
    return new HttpErrorResponse({
      status:     error.status,
      statusText: error.statusText,
      url:        error.url ?? undefined,
      error: {
        statusCode: error.status || 0,
        message:
          error.status === 0
            ? 'No se pudo conectar con el servidor. Verifica tu conexión.'
            : `Error del servidor (${error.status})`,
      },
    });
  }

  return error;
}
