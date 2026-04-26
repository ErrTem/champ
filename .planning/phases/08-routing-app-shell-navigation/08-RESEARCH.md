# Phase 8: Routing + app shell navigation - Research

**Researched:** 2026-04-26  
**Domain:** Ionic 8 + Angular Router (tabs, redirects, back navigation)  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Routes + defaults
- Remove/disable Home route; `/` must land on `/explore`.
- Unknown route wildcard must redirect to `/explore`.
- Login redirect: use `returnTo` when provided, else `/explore`.

### Shared back behavior
- Add explicit back arrow top-left on all primary pages via shared header pattern.

### Footer navigation
- Use Ionic tabs (or equivalent app-shell level persistent footer) with icons:
  - Explore
  - Bookings
  - Profile
  - Admin (admin users only)
- Admin tab gating based on `isAdmin` (sourced from `/users/me`).
- Deep links must preserve selected tab + correct back behavior.

### Non-goals
- No new domain/business rules; navigation-only changes unless needed to keep routing sane.

### Deferred Ideas (OUT OF SCOPE)
None — Phase 8 scope fully captured above.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R3 | Routing defaults + remove Home + shared back navigation | Current routes have `home` + `'' -> home` and no wildcard; `ion-back-button` exists only on fighter profile; needs shared header/back pattern + redirect rules + returnTo plumbing. [VERIFIED: codebase `src/app/app.routes.ts`, `src/app/pages/login/login.page.ts`, `src/app/pages/fighter-profile/fighter-profile.page.html`] |
| R4 | Bottom footer navigation (Explore / Bookings / Profile / Admin) | Existing `ion-tabs` usage exists in Admin area; docs specify `ion-tabs` works as router outlet and requires `ion-router-outlet` integration; routing must follow tabs best practices for deep links/tab selection. [VERIFIED: codebase `src/app/pages/admin/admin-tabs.page.html`][CITED: https://ionicframework.com/docs/angular/navigation#working-with-tabs][CITED: https://ionicframework.com/docs/v7/api/tabs] |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

- Caveman communication style for chat only; code/docs normal. [VERIFIED: codebase `.cursor/rules/caveman.mdc`]
- Stack: Angular 20 + Ionic 8 existing scaffold. Follow Angular style guide + existing `src/` patterns. [VERIFIED: codebase `.cursor/rules/gsd-project-context.md`]
- Validation enabled (`workflow.nyquist_validation: true`). Security enforcement enabled (ASVS L1, block on high). [VERIFIED: codebase `.planning/config.json`]

## Summary

Current app uses Angular standalone routing in `src/app/app.routes.ts` with top-level pages, including `home` and default redirect `'' -> home`, but no wildcard redirect. Auth guard redirects unauth users to `/login` without `returnTo`, while login page supports `returnTo` but defaults to `/profile` (must become `/explore`). [VERIFIED: codebase `src/app/app.routes.ts`, `src/app/core/guards/auth.guard.ts`, `src/app/pages/login/login.page.ts`]

Ionic docs for Angular tabs: use non-linear routing with `ion-tabs` + nested `ion-router-outlet`. Child routes inside tabs should be written as sibling routes with tab path prefix so deep links keep tab selected and back behavior stays sane. Avoid linear-history APIs (`LocationStrategy.historyGo`) in tabs apps. [CITED: https://ionicframework.com/docs/angular/navigation#working-with-tabs]

**Primary recommendation:** create authenticated app-shell `TabsPage` using `ion-tabs` + `ion-tab-bar`, move primary routes under tab-prefix URLs (`/explore/...`, `/bookings/...`, `/profile`, `/admin/...`), set redirects (`/` and `**`) to `/explore`, add shared header component that renders `ion-back-button` w/ `defaultHref="/explore"` and consistent title.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Routing defaults (`/` → `/explore`, `**` → `/explore`) | Client | — | Angular Router config owns redirects. [VERIFIED: codebase `src/app/app.routes.ts`] |
| App shell tabs footer (Explore/Bookings/Profile/Admin) | Client | — | Ionic `ion-tabs` + Angular router compose app shell. [CITED: https://ionicframework.com/docs/angular/navigation#working-with-tabs] |
| Admin tab gating (`isAdmin` from `/users/me`) | Client | API/Backend | UI hides tab, backend still enforces admin endpoints. AuthService already loads `/users/me`. [VERIFIED: codebase `src/app/core/services/auth.service.ts`, `src/app/core/guards/admin.guard.ts`] |
| Shared back arrow/header | Client | — | Header UI pattern in Ionic pages. `ion-back-button` uses Ionic nav stack and `defaultHref`. [CITED: https://ionicframework.com/docs/v7/api/back-button] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@ionic/angular` | 8.8.4 | Ionic UI + router outlet integration | Project already uses Ionic standalone imports. [VERIFIED: npm registry `npm view @ionic/angular version`][VERIFIED: codebase `package.json`] |
| `@angular/router` | 21.2.10 | Routing config, redirects, guards | Existing `Routes` config in `app.routes.ts`. [VERIFIED: npm registry `npm view @angular/router version`][VERIFIED: codebase `package.json`] |
| `ionicons` | 8.0.13 | Tab bar icons | Requested icons for footer nav. [VERIFIED: npm registry `npm view ionicons version`][VERIFIED: codebase `package.json`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@angular/cli` | 21.2.8 | build/test/lint tooling | `ng serve`, `ng test`, `ng lint`. [VERIFIED: npm registry `npm view @angular/cli version`][VERIFIED: codebase `package.json`] |
| `@ionic/angular-toolkit` | 12.3.0 | Ionic schematics | Page generation conventions; standalone pages. [VERIFIED: npm registry `npm view @ionic/angular-toolkit version`][VERIFIED: codebase `package.json`] |

**Installation:** already present. (No new packages required for Phase 8 unless adding shared UI component library internally.)

## Architecture Patterns

### System Architecture Diagram

```text
URL / Deep Link
  |
  v
Angular Router (redirects: '' + '**')
  |
  +--> Public routes (login/register/reset...)
  |
  +--> Tabs Shell Route (app shell)
          |
          v
       ion-tabs
          |
          +--> ion-tab-bar (Explore / Bookings / Profile / Admin*)
          |
          v
       ion-router-outlet (tab stack)
          |
          +--> /explore/... (catalog, fighter profile, book flow)
          +--> /bookings/... (my bookings, booking detail)
          +--> /profile (profile page)
          +--> /admin/... (admin tabs + children)  (*only if isAdmin)
```

Docs note: tabs are non-linear routing; each tab own stack. [CITED: https://ionicframework.com/docs/angular/navigation#working-with-tabs]

### Recommended Project Structure

```text
src/app/
  shell/
    tabs.page.ts|html|scss        # app shell tab bar + ion-tabs outlet
    header.component.ts|html|scss # shared header w/ back button + title
  app.routes.ts                   # redirects + shell + public routes
  core/guards/                    # auth/admin guards (returnTo support)
  pages/                          # feature pages (catalog, bookings, profile, admin...)
```

### Pattern: Tabs routing (Ionic Angular)

**What:** `ion-tabs` renders nested `ion-router-outlet`; Angular routes define child routes for each tab prefix.  
**When to use:** persistent footer nav with per-tab stack and deep link tab selection.  
**Example (shape, not exact code):**

```typescript
// Source: https://ionicframework.com/docs/angular/navigation#working-with-tabs
// tabs route has children; each tab has path prefix (explore/bookings/profile/admin)
```

### Pattern: Child routes within tabs use shared-URL siblings

**What:** if you need `/explore/fighters/:id`, declare route with `explore/...` prefix at same nesting level so tab stays selected.  
**Why:** nested routes inside tab page can break tab selection/back; docs recommend sibling route with tab prefix.  
[CITED: https://ionicframework.com/docs/angular/navigation#child-routes-within-tabs]

### Anti-Patterns to Avoid

- **Using linear-history APIs in tabs app:** `LocationStrategy.historyGo()` assumes linear history, breaks non-linear tab stacks. [CITED: https://ionicframework.com/docs/angular/navigation#navigating-using-locationstrategyhistorygo]  
- **Cross-routing between tabs via buttons:** tabs should be switched by tab bar; otherwise history becomes confusing. [CITED: https://ionicframework.com/docs/angular/navigation#switching-between-tabs]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|--------|-------------|-------------|-----|
| Back stack management | custom “back stack” arrays | `ion-back-button` + Ionic router stack | Handles native-like stack + shows only when history exists; `defaultHref` covers empty stack. [CITED: https://ionicframework.com/docs/v7/api/back-button] |
| Tab selection state | custom store for active tab | URL-driven tab selection via router + `ion-tabs` | Ionic resolves active tab based on URL. [CITED: https://ionicframework.com/docs/v7/api/tabs] |

## Common Pitfalls

### Pitfall: Tabs vanish on deep link
**What goes wrong:** navigate to route not prefixed with tab path → leaves tabs outlet → tab bar disappears.  
**Why:** route not rendered inside tabs’ nested `ion-router-outlet`.  
**How to avoid:** ensure deep-link routes meant “inside tab” have URL prefix (example: `explore/fighters/:id`, `bookings/:bookingId`). [CITED: https://ionicframework.com/docs/angular/navigation#child-routes-within-tabs]

### Pitfall: Back button not visible / wrong fallback
**What goes wrong:** `ion-back-button` hides when no Ionic history; users stuck.  
**How to avoid:** always set `defaultHref` for primary pages, consistent (locked: `/explore`). [CITED: https://ionicframework.com/docs/v7/api/back-button#default-back-history]

### Pitfall: Auth guard loses returnTo
**What goes wrong:** guard redirects to `/login` without preserving attempted URL; post-login drops user elsewhere.  
**How to avoid:** build `UrlTree` to `/login` with `queryParams: { returnTo: state.url }` and login default to `/explore`. [VERIFIED: codebase shows returnTo already used in booking flow; guard currently drops it.]

## Codebase Findings (current state)

- Routes include `home` and default redirect to `home`. No wildcard redirect. [VERIFIED: codebase `src/app/app.routes.ts`]
- `LoginPage` reads `returnTo` query param but defaults to `/profile` (must become `/explore`). [VERIFIED: codebase `src/app/pages/login/login.page.ts`]
- `authGuard` redirects unauth to `/login` without `returnTo`. [VERIFIED: codebase `src/app/core/guards/auth.guard.ts`]
- `adminGuard` already gates `admin` route using `u?.isAdmin` from `/users/me`. [VERIFIED: codebase `src/app/core/guards/admin.guard.ts`, `src/app/core/services/auth.service.ts`]
- `ion-tabs` already used in admin area (`AdminTabsPage`) with bottom bar and router outlet. [VERIFIED: codebase `src/app/pages/admin/admin-tabs.page.html`]
- `ion-back-button` exists on fighter profile page only; other primary pages use plain headers. [VERIFIED: codebase `src/app/pages/fighter-profile/fighter-profile.page.html`, other `*.page.html` headers]

## Environment Availability

Step 2.6: SKIPPED (no external services required; frontend-only routing/UI changes). [ASSUMED]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (Angular CLI) [VERIFIED: codebase `karma.conf.js`, `angular.json`] |
| Config file | `karma.conf.js` [VERIFIED: codebase] |
| Quick run command | `npm test` [VERIFIED: codebase `package.json` scripts] |
| Full suite command | `npm test` (same) [VERIFIED: codebase `package.json` scripts] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R3 | `/` redirects to `/explore`; `**` redirects to `/explore`; login default `/explore`; shared header/back renders | unit/integration (router) | `npm test` | ❌ Wave 0 (need spec) [ASSUMED] |
| R4 | tabs render in shell; admin tab hidden unless admin; deep links keep correct tab selected | integration (router + component) | `npm test` | ❌ Wave 0 (need spec) [ASSUMED] |

### Sampling Rate
- **Per task commit:** `npm test`
- **Phase gate:** `npm test` green before human UAT

### Wave 0 Gaps
- [ ] Add routing/tabs spec(s) for redirects + tab selection + admin gating. [ASSUMED]

## Security Domain

Security enforcement enabled. Routing/navigation changes touch auth/session UX and admin access affordances.

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | `authGuard` + `/users/me` session check; preserve `returnTo` safely. [VERIFIED: codebase `authGuard`, `AuthService.loadProfile()`] |
| V3 Session Management | yes | Cookie session (`withCredentials: true`) already used; routing must not leak sensitive return URLs. [VERIFIED: codebase `AuthService` uses `withCredentials`] |
| V4 Access Control | yes | Admin route guard + UI tab gating; backend remains enforcement source. [VERIFIED: codebase `adminGuard`] |
| V5 Input Validation | limited | Validate `returnTo` (avoid open redirect to external URL). [ASSUMED] |
| V6 Cryptography | no | Not in Phase 8 scope. |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect via `returnTo` | Spoofing | Allow only relative in-app paths (e.g. starting with `/`), else ignore and go `/explore`. [ASSUMED best practice] |
| Privilege UI leak (admin tab visible) | Info disclosure | Hide tab unless `user.isAdmin`; still guard `/admin` routes. [VERIFIED: codebase already guards `/admin`] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `/explore` should live inside authenticated tabs shell (or at least behave consistently with tabs) | Summary / Diagram | Wrong could force different route prefixes (e.g. `/tabs/...`) and rework deep links. |
| A2 | Phase can skip environment audit (no external deps) | Environment Availability | If mobile builds/Capacitor involved, might need platform-specific back behavior checks. |
| A3 | Add new Karma specs for R3/R4 (none exist yet) | Validation Architecture | If repo already has tests, plan differs; if none, wave 0 must add harness. |
| A4 | Validate `returnTo` to prevent open redirect | Security Domain | If ignored, potential phishing vector via crafted links. |

## Open Questions

## Open Questions (RESOLVED)

1. **Should `/explore` be accessible without login? — RESOLVED**
   - Decision: **Yes, `/explore` remains accessible without login.**
   - Contract: footer tab bar is **app-shell UI** and must be visible for authenticated shell; for unauth users, either hide the tab bar entirely or render only Explore affordance (secure + low-confusion). Guard `/bookings/**`, `/profile`, `/admin/**` as required by R3/R4.

2. **Deep link canonical URLs — RESOLVED**
   - Decision: canonical URLs use tab prefixes:
     - `/explore/**`, `/bookings/**`, `/profile`, `/admin/**`
   - Contract: keep legacy aliases as redirects (minimum set):
     - `/my-bookings` → `/bookings`
     - `/fighters/:fighterId` → `/explore/fighters/:fighterId`

## Sources

### Primary (HIGH confidence)
- Ionic Angular Navigation (tabs/non-linear routing; child routes within tabs): `https://ionicframework.com/docs/angular/navigation` [CITED]
- Ionic `ion-tabs` API: `https://ionicframework.com/docs/v7/api/tabs` [CITED]
- Ionic `ion-back-button` API: `https://ionicframework.com/docs/v7/api/back-button` [CITED]
- Repo routing/guards/auth: `src/app/app.routes.ts`, `src/app/core/guards/auth.guard.ts`, `src/app/pages/login/login.page.ts`, `src/app/core/services/auth.service.ts` [VERIFIED: codebase]

### Primary (HIGH confidence) — package versions
- `npm view @ionic/angular version` → 8.8.4 [VERIFIED: npm registry]
- `npm view @angular/router version` → 21.2.10 [VERIFIED: npm registry]
- `npm view ionicons version` → 8.0.13 [VERIFIED: npm registry]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm + repo `package.json`.
- Architecture: MEDIUM — docs clear; exact route shape depends on auth-vs-public explore decision (Open Question 1).
- Pitfalls: HIGH — directly from Ionic Angular navigation docs.

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26

