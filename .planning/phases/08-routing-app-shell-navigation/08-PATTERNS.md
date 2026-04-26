# Phase 8: Routing + app shell navigation - Pattern Map

**Mapped:** 2026-04-26  
**Files analyzed:** 9 (expected new/modified)  
**Analogs found:** 8 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/app.routes.ts` (modify) | config (router) | request-response (client routing) | `src/app/app.routes.ts` | exact |
| `src/app/core/guards/auth.guard.ts` (modify) | middleware/guard | request-response | `src/app/core/guards/auth.guard.ts` | exact |
| `src/app/pages/login/login.page.ts` (modify) | component/page | request-response | `src/app/pages/login/login.page.ts` | exact |
| `src/app/core/guards/admin.guard.ts` (maybe modify) | middleware/guard | request-response | `src/app/core/guards/admin.guard.ts` | exact |
| `src/app/shell/tabs.page.ts` (new) | component/page (shell) | request-response | `src/app/pages/admin/admin-tabs.page.ts` | role-match |
| `src/app/shell/tabs.page.html` (new) | component template | request-response | `src/app/pages/admin/admin-tabs.page.html` | role-match |
| `src/app/shell/tabs.page.scss` (new) | styling | n/a | `src/app/pages/admin/admin-tabs.page.scss` | role-match (not read) |
| `src/app/shell/header.component.ts` (new) | component | request-response | `src/app/pages/fighter-profile/fighter-profile.page.ts` | partial (no shared components exist) |
| `src/app/shell/header.component.html` (new) | component template | request-response | `src/app/pages/fighter-profile/fighter-profile.page.html` | partial (no shared components exist) |

## Pattern Assignments

### `src/app/app.routes.ts` (config/router)

**Analog:** `src/app/app.routes.ts`

**Route definition style** (lines 1-4, 5-106):

```ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-tabs.page').then((m) => m.AdminTabsPage),
    canActivate: [adminGuard],
    children: [
      // ...
      { path: '', redirectTo: 'fighters', pathMatch: 'full' },
    ],
  },
  // ... top-level pages ...
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
```

**Redirect pattern**: uses `{ path: '', redirectTo: 'home', pathMatch: 'full' }` at bottom (lines 101-105).  
Phase 8 changes should keep this same redirect style, swapping target to `/explore` and adding wildcard redirect in same array.

**Lazy page load pattern**: `loadComponent: () => import('...').then((m) => m.SomePage)` (lines 8, 41, 45-47, etc).

---

### `src/app/core/guards/auth.guard.ts` (guard)

**Analog:** `src/app/core/guards/auth.guard.ts`

**Guard pattern: inject + service call + `UrlTree`** (lines 1-11):

```ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(
    map((u) => (u ? true : router.createUrlTree(['/login']))),
  );
};
```

**How to extend for `returnTo`:** keep same `router.createUrlTree(...)` approach, but add `queryParams` (same guard, same rxjs `map` shape).

---

### `src/app/pages/login/login.page.ts` (page)

**Analog:** `src/app/pages/login/login.page.ts`

**Standalone Ionic imports pattern** (lines 4-29):

```ts
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
```

**Return-to redirect pattern** (lines 40-55):

```ts
submit(): void {
  this.error = '';
  this.auth.login({ email: this.email, password: this.password }).subscribe({
    next: () => {
      const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
      if (returnTo) {
        void this.router.navigateByUrl(returnTo);
        return;
      }
      void this.router.navigateByUrl('/profile');
    },
    error: () => {
      this.error = 'Invalid email or password';
    },
  });
}
```

**Phase 8 change point:** default `navigateByUrl('/profile')` becomes `'/explore'` while keeping the same `returnTo` precedence.

---

### `src/app/core/guards/admin.guard.ts` (guard)

**Analog:** `src/app/core/guards/admin.guard.ts`

**Admin gate pattern** (lines 6-11):

```ts
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(
    map((u) => (u?.isAdmin ? true : router.createUrlTree(['/profile']))),
  );
};
```

**Phase 8 change point:** if “Profile” becomes tab route (likely `/profile` inside tabs), redirect target may remain valid; if canonical changes (like `/tabs/profile`), update only this string, keep same guard structure.

---

### `src/app/shell/tabs.page.ts` (new shell component)

**Analog:** `src/app/pages/admin/admin-tabs.page.ts`

**Imports + standalone component style** (lines 1-36):

```ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
})
export class AdminTabsPage {}
```

**Copy to tabs shell:** same Ionic tab primitives (`IonTabs`, `IonTabBar`, `IonTabButton`) + router directives, then adjust selector/template path/title and add admin-tab visibility logic if needed.

---

### `src/app/shell/tabs.page.html` (new shell template)

**Analog:** `src/app/pages/admin/admin-tabs.page.html`

**`ion-tabs` + bottom bar + `router-outlet` pattern** (lines 7-26):

```html
<ion-content fullscreen="true" class="auth-shell">
  <ion-tabs>
    <ion-tab-bar slot="bottom" class="admin-tabbar">
      <ion-tab-button tab="fighters" routerLink="/admin/fighters" routerLinkActive="active">
        <ion-label>Fighters</ion-label>
      </ion-tab-button>
      <!-- ... -->
    </ion-tab-bar>

    <router-outlet></router-outlet>
  </ion-tabs>
</ion-content>
```

**Copy to app shell:** same structure, but tab buttons become `/explore`, `/my-bookings` (or canonical `/bookings`), `/profile`, `/admin/...` (conditional).

---

### `src/app/shell/header.component.ts` + `src/app/shell/header.component.html` (new shared header/back)

**Analog:** `src/app/pages/fighter-profile/fighter-profile.page.ts` + `fighter-profile.page.html`

**Ionic back button imports** (fighter profile TS lines 3-34):

```ts
import {
  IonButtons,
  IonBackButton,
  IonHeader,
  IonTitle,
  IonToolbar,
  // ...
} from '@ionic/angular/standalone';
```

**Back button markup pattern** (fighter profile HTML lines 1-8):

```html
<ion-header translucent="true" class="profile-topbar">
  <ion-toolbar>
    <ion-buttons slot="start">
      <ion-back-button defaultHref="/explore" text=""></ion-back-button>
    </ion-buttons>
    <ion-title>Profile</ion-title>
  </ion-toolbar>
</ion-header>
```

**Title-only header pattern** (catalog HTML lines 1-5; profile HTML lines 1-5; my-bookings HTML lines 1-5):

```html
<ion-header translucent="true">
  <ion-toolbar>
    <ion-title>My bookings</ion-title>
  </ion-toolbar>
</ion-header>
```

**How to apply:** shared header component should combine these: optional back button slot + title, using consistent `defaultHref="/explore"` and `text=""`.

## Shared Patterns

### Standalone Ionic imports everywhere
**Source:** `src/app/pages/login/login.page.ts` (lines 4-29), `src/app/pages/fighter-profile/fighter-profile.page.ts` (lines 3-34), `src/app/pages/admin/admin-tabs.page.ts` (lines 4-34)  
**Apply to:** new tabs shell + header component

### Tabs implementation uses Angular router primitives
**Source:** `src/app/pages/admin/admin-tabs.page.ts` (imports `RouterLink`, `RouterLinkActive`, `RouterOutlet`) + `admin-tabs.page.html` (`routerLink` on `ion-tab-button`, `<router-outlet>`)  
**Apply to:** app shell tabs

### Routing config uses `loadComponent` + `children` + redirects
**Source:** `src/app/app.routes.ts` (lines 5-106)  
**Apply to:** moving routes under shell, adding `''` and `**` redirects

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/app/shell/header.component.ts` | component | request-response | No shared UI components folder yet; only per-page headers exist. Use fighter profile header/back pattern as base. |

## Metadata

**Analog search scope:** `src/app/**`  
**Key files scanned:** `src/app/app.routes.ts`, `src/app/core/guards/{auth,admin}.guard.ts`, `src/app/pages/login/login.page.ts`, `src/app/pages/admin/admin-tabs.page.{ts,html}`, `src/app/pages/*/*.page.html`, `src/app/pages/fighter-profile/fighter-profile.page.{ts,html}`  
**Pattern extraction date:** 2026-04-26

