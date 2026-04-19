import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo usuarios autenticados con rol CLIENTE (p. ej. checkout). */
export const clienteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/checkout' } });
  }
  const s = auth.getSession();
  if (s?.role === 'CLIENTE') {
    return true;
  }
  return router.createUrlTree([auth.getPostLoginPath()], {
    queryParams: auth.getPostLoginQueryParams(),
  });
};
