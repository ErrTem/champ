import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('should redirect unauth users to /login with returnTo', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadProfile: () => of(null),
          },
        },
      ],
    });

    const router = TestBed.inject(Router);

    const res = await TestBed.runInInjectionContext(async () => {
      const out = authGuard({} as any, { url: '/bookings?x=1' } as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(res).not.toBeTrue();
    expect(router.serializeUrl(res as any)).toBe('/login?returnTo=%2Fbookings%3Fx%3D1');
  });

  it('should allow when user exists', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadProfile: () => of({ id: 'u1' }),
          },
        },
      ],
    });

    const res = await TestBed.runInInjectionContext(async () => {
      const out = authGuard({} as any, { url: '/profile' } as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(res).toBeTrue();
  });
});

