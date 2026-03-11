import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Validar sesión contra el backend (no confiar solo en estado local)
  return authService.getProfile().pipe(
    map((user: any) => {
      authService.currentUser.set(user);
      authService.isAuthenticated.set(true);
      return true;
    }),
    catchError(() => {
      authService.currentUser.set(null);
      authService.isAuthenticated.set(false);
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
      return of(false);
    }),
  );
};
