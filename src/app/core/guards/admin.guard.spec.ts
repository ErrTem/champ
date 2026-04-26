import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
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
      const out = adminGuard({} as any, { url: '/admin/fighters' } as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(router.serializeUrl(res as any)).toBe('/login?returnTo=%2Fadmin%2Ffighters');
  });

  it('should redirect non-admin users to /explore', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadProfile: () => of({ id: 'u1', isAdmin: false }),
          },
        },
      ],
    });

    const router = TestBed.inject(Router);

    const res = await TestBed.runInInjectionContext(async () => {
      const out = adminGuard({} as any, { url: '/admin/fighters' } as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(router.serializeUrl(res as any)).toBe('/explore');
  });
});

