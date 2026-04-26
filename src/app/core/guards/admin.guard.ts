import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(
    map((u) => {
      if (!u) {
        return router.createUrlTree(['/login'], {
          queryParams: { returnTo: state.url },
        });
      }
      return u.isAdmin ? true : router.createUrlTree(['/explore']);
    }),
  );
};

