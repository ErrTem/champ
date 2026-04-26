---
phase: 08-routing-app-shell-navigation
verified: 2026-04-26T10:42:00Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Unauth access to `/admin/**` redirects to `/login?returnTo=/admin/...`; auth but non-admin redirects to `/explore`."
    status: resolved
    reason: "`adminGuard` updated: unauth -> `/login?returnTo=<state.url>`; auth non-admin -> `/explore`."
    artifacts:
      - path: "src/app/core/guards/admin.guard.ts"
        issue: "Fixed to preserve returnTo and redirect non-admin to /explore."
      - path: "src/app/core/guards/admin.guard.spec.ts"
        issue: "Added regression coverage for unauth + non-admin behavior."
    missing: []
human_verification:
  - test: "Cold deep link then header back"
    expected: "Open app at `/explore/fighters/:id` with no history; back arrow navigates to `/explore` (not Home) and tab stays Explore."
    why_human: "Depends on Ionic history stack behavior on device/browser cold start."
  - test: "Tab re-press returns to tab root"
    expected: "While on `/explore/fighters/:id`, tapping Explore tab navigates to `/explore` (pop-to-root). Repeat for Bookings/Profile/Admin."
    why_human: "RouterLink + ion-tabs interaction may keep route if already active; needs UI interaction test."
  - test: "Cross-tab back stays sane"
    expected: "Navigate Explore → details, switch to Profile, hit back: stays within Profile stack or falls back to `/explore` deterministically (no cross-tab chain confusion)."
    why_human: "Ionic navigation stack behavior across tabs hard to prove by static inspection."
---

# Phase 8: Routing + app shell navigation Verification Report

**Phase Goal:** remove/disable Home; `/` and `**` → `/explore`; auth guard preserves attempted URL via `returnTo`; post-login uses safe `returnTo` else `/explore`; app shell tabs Explore/Bookings/Profile (+ Admin only for admins); no nested admin tab bars; shared header/back on primary pages with fallback `/explore`.
**Verified:** 2026-04-26T10:42:00Z
**Status:** human_needed
**Re-verification:** No — initial verification with gap closure applied

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/` lands on `/explore`; Home not default | ✓ VERIFIED | `src/app/app.routes.ts` has `{ path: '', redirectTo: 'explore', pathMatch: 'full' }` under shell; `home` route exists only as redirect to `explore`. |
| 2 | Unknown URLs redirect to `/explore` | ✓ VERIFIED | `src/app/app.routes.ts` has `{ path: '**', redirectTo: 'explore' }`. |
| 3 | Auth guard preserves attempted URL via `returnTo` | ✓ VERIFIED | `src/app/core/guards/auth.guard.ts` uses `queryParams: { returnTo: state.url }`; test asserts serialized URL includes encoded query (`auth.guard.spec.ts`). |
| 4 | Post-login uses safe `returnTo` else `/explore` | ✓ VERIFIED | `src/app/pages/login/login.page.ts` validates `startsWith('/') && !startsWith('//')`, else `navigateByUrl('/explore')`; tests cover safe + unsafe (`login.page.spec.ts`). |
| 5 | App shell tabs Explore/Bookings/Profile + Admin only for admins | ✓ VERIFIED | `src/app/shell/tabs.page.html` renders 3 tabs always, admin tab behind `*ngIf="user()?.isAdmin === true"`; spec asserts default hides Admin and admin shows (`tabs.page.spec.ts`). |
| 6 | No nested admin tab bars | ✓ VERIFIED | `src/app/pages/admin/admin-tabs.page.html` contains only `<router-outlet>`; no `<ion-tabs>`/`<ion-tab-bar>` in admin pages. |
| 7 | `/admin/**` gating matches UI-SPEC (unauth -> login with returnTo; non-admin -> `/explore`) | ✓ VERIFIED | `src/app/core/guards/admin.guard.ts` preserves `state.url` for unauth and redirects non-admin to `/explore`; tests cover both cases (`admin.guard.spec.ts`). |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---------|----------|--------|---------|
| `src/app/app.routes.ts` | redirects + shell route tree | ✓ VERIFIED | Redirects for `''` and `**` to `explore`; canonical prefixes; legacy redirects present. |
| `src/app/core/guards/auth.guard.ts` | unauth → `/login?returnTo=<attempted>` | ✓ VERIFIED | Uses `state.url` and `createUrlTree(['/login'], { queryParams: { returnTo } })`. |
| `src/app/pages/login/login.page.ts` | safe `returnTo` + default `/explore` | ✓ VERIFIED | `isSafeReturnTo` rejects `//...`; default `/explore`. |
| `src/app/shell/tabs.page.html` | tab bar + routerLinks | ✓ VERIFIED | `ion-tab-bar slot="bottom"` + `/explore` `/bookings` `/profile` + admin-gated `/admin/fighters`. |
| `src/app/pages/admin/admin-tabs.page.html` | no nested tabs | ✓ VERIFIED | router outlet only. |
| `src/app/shell/header.component.html` | back button defaultHref `/explore` | ✓ VERIFIED | `<ion-back-button defaultHref="/explore" text=""></ion-back-button>`. |
| `src/app/core/guards/admin.guard.ts` | admin gating per UI-SPEC | ✓ VERIFIED | Unauth -> `/login?returnTo=...`; non-admin -> `/explore`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/core/guards/auth.guard.ts` | `/login` | `createUrlTree` + `queryParams.returnTo` | ✓ WIRED | `queryParams: { returnTo: state.url }` present. |
| `src/app/pages/login/login.page.ts` | `router.navigateByUrl` | safe `returnTo` handling | ✓ WIRED | `isSafeReturnTo()` gate + fallback `/explore`. |
| `src/app/shell/tabs.page.html` | `ion-tab-bar` | `routerLink` tabs | ✓ WIRED | routerLinks for all required tabs, admin gated. |
| `src/app/shell/header.component.html` | `/explore` | `ion-back-button defaultHref` | ✓ WIRED | `defaultHref="/explore"` present. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---------|---------------|--------|--------------------|--------|
| `src/app/shell/tabs.page.html` | `user()?.isAdmin` | `TabsPage.user()` (AuthService signal) | Unknown by static scan | ⚠️ HUMAN — depends on AuthService profile load timing + signal wiring |

### Behavioral Spot-Checks

Step 7b: SKIPPED (no safe, already-running entrypoint to curl; Angular/Ionic app needs runtime to validate navigation stack behavior).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|------------|-------------|--------|----------|
| R3 | 08-01/08-02/08-04/08-03 | routing defaults + back/header + returnTo | ⚠️ HUMAN NEEDED | Automated + static checks pass; human deep-link/back behavior remains. |
| R4 | 08-01/08-03 | footer tabs + admin gating + deep links | ⚠️ HUMAN NEEDED | Admin gating verified; human deep-link/tab/back interactions remain. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/app/core/guards/admin.guard.ts` | — | — | — | Resolved by guard update + regression tests. |

### Human Verification Required

1. **Cold deep link then header back**
   - **Test:** open `/explore/fighters/:id` from cold start (no history), press back.
   - **Expected:** goes to `/explore`, Explore tab active.
   - **Why human:** Ionic history stack depends on runtime.

2. **Tab re-press returns to tab root**
   - **Test:** from `/explore/fighters/:id` tap Explore tab.
   - **Expected:** navigates to `/explore` (pop-to-root feel).
   - **Why human:** ion-tabs + routerLink behavior needs interaction.

3. **Cross-tab back stays sane**
   - **Test:** Explore detail → switch Profile → back.
   - **Expected:** deterministic within-tab back or fallback `/explore`.
   - **Why human:** runtime navigation stack.

### Gap Closure

Admin route gating fixed:
- unauth deep link `/admin/...` now goes `/login?returnTo=/admin/...`
- auth non-admin now redirects to `/explore`

---

_Verified: 2026-04-26T10:42:00Z_
_Verifier: Claude (gsd-verifier)_

