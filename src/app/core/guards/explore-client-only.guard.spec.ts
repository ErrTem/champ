import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { exploreClientOnlyGuard } from './explore-client-only.guard';

describe('exploreClientOnlyGuard', () => {
  it('should allow anonymous users', async () => {
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

    const res = await TestBed.runInInjectionContext(async () => {
      const out = exploreClientOnlyGuard({} as any, {} as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(res).toBe(true);
  });

  it('should allow client accounts', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadProfile: () => of({ id: 'u1', userType: 'user' as const }),
          },
        },
      ],
    });

    const res = await TestBed.runInInjectionContext(async () => {
      const out = exploreClientOnlyGuard({} as any, {} as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(res).toBe(true);
  });

  it('should redirect fighters to /profile', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            loadProfile: () => of({ id: 'u1', userType: 'fighter' as const }),
          },
        },
      ],
    });

    const router = TestBed.inject(Router);

    const res = await TestBed.runInInjectionContext(async () => {
      const out = exploreClientOnlyGuard({} as any, {} as any);
      const obs = isObservable(out) ? out : of(out);
      return await firstValueFrom(obs);
    });

    expect(router.serializeUrl(res as any)).toBe('/profile');
  });
});
