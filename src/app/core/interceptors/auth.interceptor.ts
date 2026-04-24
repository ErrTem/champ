import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);
      const url = req.url;
      if (
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/register')
      ) {
        return throwError(() => err);
      }
      return auth.refreshSession().pipe(
        switchMap(() => next(req)),
        catchError((e) => throwError(() => e)),
      );
    }),
  );
};
