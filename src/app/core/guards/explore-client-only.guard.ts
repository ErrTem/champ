import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Fighters use fighter tools / profile; catalog browse is client-only. */
export const exploreClientOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(
    map((u) => (u?.userType === 'fighter' ? router.createUrlTree(['/profile']) : true)),
  );
};
