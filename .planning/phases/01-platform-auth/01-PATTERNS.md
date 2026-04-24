# Phase 1 — Pattern Map

**Mapped:** 2026-04-24

## PATTERN MAPPING COMPLETE

## Summary

Greenfield auth on an Ionic 8 + Angular 20 starter. Closest analogs live under `src/app/` for routing and pages; backend is new under `backend/`.

## Files to Create / Modify

| Planned file / area | Role | Closest analog | Excerpt / convention |
|---------------------|------|----------------|----------------------|
| `src/app/app.routes.ts` | Route table | Existing `routes` export | `loadComponent` + `redirectTo` pattern |
| `src/main.ts` | Bootstrap | Current `bootstrapApplication` | Add `provideHttpClient(withFetch())` and interceptors |
| New `*.page.ts` | Standalone page | `src/app/home/home.page.ts` | `@Component` + `imports: [IonicModule, RouterLink, ...]` |
| `backend/src/main.ts` | Nest bootstrap | — (new) | `NestFactory.create`, `ValidationPipe`, `cookie-parser` |
| `register.html`, `login.html` | Visual reference | Repo root mocks | Mirror layout per `01-UI-SPEC.md` |

## Data flow

- **Client → API:** JSON bodies for signup/login/reset/profile; **cookies** for tokens (`withCredentials: true`).
- **API → DB:** Prisma client in services; no PII in logs except D-04 dev reset link logging.

## Code excerpts (existing)

```1:13:d:\programming\champ-app\src\app\app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
```

Executor should extend `routes` with lazy `login`, `register`, `forgot-password`, `profile`, and auth guard on post-login shell.
