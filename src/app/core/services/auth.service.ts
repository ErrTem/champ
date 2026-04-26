import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  isAdmin: boolean;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiUrl;

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly authenticated = computed(() => this._user() !== null);

  private refreshInFlight: Observable<void> | null = null;
  private profileInFlight: Observable<AuthUser | null> | null = null;

  loadProfile(options?: { force?: boolean }): Observable<AuthUser | null> {
    const force = options?.force === true;
    if (!force) {
      const existing = this._user();
      if (existing) return of(existing);
      if (this.profileInFlight) return this.profileInFlight;
    }

    const req$ = this.http.get<AuthUser>(`${this.baseUrl}/users/me`, { withCredentials: true }).pipe(
      tap((u) => this._user.set(u)),
      map((u) => u as AuthUser),
      catchError(() => {
        this._user.set(null);
        return of(null);
      }),
      finalize(() => {
        if (this.profileInFlight === req$) this.profileInFlight = null;
      }),
      shareReplay(1),
    );

    if (!force) this.profileInFlight = req$;
    return req$;
  }

  register(body: { email: string; password: string; name?: string; phone?: string }) {
    return this.http
      .post<{ user: AuthUser }>(`${this.baseUrl}/auth/register`, body, { withCredentials: true })
      .pipe(tap((r) => this._user.set(r.user)));
  }

  login(body: { email: string; password: string }) {
    return this.http
      .post<{ user: AuthUser }>(`${this.baseUrl}/auth/login`, body, { withCredentials: true })
      .pipe(tap((r) => this._user.set(r.user)));
  }

  logout() {
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this._user.set(null);
        void this.router.navigateByUrl('/login');
      }),
    );
  }

  refreshSession(): Observable<void> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<unknown>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          map(() => void 0),
          catchError((e) => throwError(() => e)),
          finalize(() => {
            this.refreshInFlight = null;
          }),
          shareReplay(1),
        );
    }
    return this.refreshInFlight;
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/auth/forgot-password`,
      { email },
      { withCredentials: true },
    );
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ ok: boolean }>(
      `${this.baseUrl}/auth/reset-password`,
      { token, password },
      { withCredentials: true },
    );
  }

  updateProfile(body: { name?: string; email?: string; phone?: string }) {
    return this.http
      .patch<AuthUser>(`${this.baseUrl}/users/me`, body, { withCredentials: true })
      .pipe(tap((u) => this._user.set(u)));
  }
}
