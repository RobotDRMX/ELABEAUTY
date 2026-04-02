import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (STATE_CHANGING_METHODS.includes(req.method)) {
    const token = getCookie('XSRF-TOKEN');
    if (token) {
      req = req.clone({
        setHeaders: { 'X-XSRF-TOKEN': token },
      });
    }
  }
  return next(req);
};
