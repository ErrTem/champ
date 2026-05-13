import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, tap } from 'rxjs';
import type { AuthUser } from '../../core/services/auth.service';
import { AuthService } from '../../core/services/auth.service';
import { LoginPage } from './login.page';

function makeRoute(returnTo: string | null): ActivatedRoute {
  return {
    snapshot: {
      queryParamMap: {
        get: () => returnTo,
      },
    },
  } as any;
}

describe('LoginPage', () => {
  it('should navigate to safe returnTo after login', async () => {
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') } as unknown as Router;
    const user = signal<AuthUser | null>(null);
    const auth = {
      user: user.asReadonly(),
      postAuthHomePath: (u: AuthUser) => (u.userType === 'fighter' ? '/profile' : '/explore'),
      login: () => of({ user: { id: 'u1', email: 'x@y.com', name: null, phone: null, isAdmin: false } }),
    } as unknown as AuthService;

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: makeRoute('/bookings') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email = 'x@y.com';
    fixture.componentInstance.password = 'pw';
    fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/bookings');
  });

  it('should reject unsafe returnTo and default to /explore', async () => {
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') } as unknown as Router;
    const user = signal<AuthUser | null>(null);
    const auth = {
      user: user.asReadonly(),
      postAuthHomePath: (u: AuthUser) => (u.userType === 'fighter' ? '/profile' : '/explore'),
      login: () => of({ user: { id: 'u1', email: 'x@y.com', name: null, phone: null, isAdmin: false } }),
    } as unknown as AuthService;

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: makeRoute('//evil.com') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email = 'x@y.com';
    fixture.componentInstance.password = 'pw';
    fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/explore');
  });

  it('should default fighters to /profile when returnTo unsafe', async () => {
    const router = { navigateByUrl: jasmine.createSpy('navigateByUrl') } as unknown as Router;
    const user = signal<AuthUser | null>(null);
    const fighter: AuthUser = {
      id: 'u1',
      email: 'f@y.com',
      name: null,
      phone: null,
      isAdmin: false,
      userType: 'fighter',
    };
    const auth = {
      user: user.asReadonly(),
      postAuthHomePath: (u: AuthUser) => (u.userType === 'fighter' ? '/profile' : '/explore'),
      login: () =>
        of({ user: fighter }).pipe(
          tap(() => {
            user.set(fighter);
          }),
        ),
    } as unknown as AuthService;

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: makeRoute('//evil.com') },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email = 'x@y.com';
    fixture.componentInstance.password = 'pw';
    fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
  });
});

