import { inject } from '@angular/core';
import { Router, CanMatchFn } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    map((user: any) => {
      authService.currentUser.set(user);
      authService.isAuthenticated.set(true);
      if (user?.role === 'admin') return true;
      // Not admin — return false; wildcard route handles redirect to '/'
      return false;
    }),
    catchError(() => {
      authService.currentUser.set(null);
      authService.isAuthenticated.set(false);
      router.navigate(['/auth/login'], { queryParams: { returnUrl: '/admin' } });
      return of(false);
    }),
  );
};
