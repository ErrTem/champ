# PLAN — Phase 08: Footer + admin nav restructure
Repo: `D:/programming/champ-app`
Phase dir: `.planning/phases/08-footer-admin-nav-restructure/`
Source of truth: `.planning/phases/08-footer-admin-nav-restructure/08-CONTEXT.md`

## Goal
Restructure Ionic/Angular app chrome so:
- **No header** on all pages.
- **No back arrow** on all pages.
- **Admin navigation** for **Fighters / Services / Schedule / Bookings** moved to **top** of admin area (not in footer).
- Admin footer area exists without duplicating admin primary nav.

## Requirements (traceability)
From `.planning/ROADMAP.md` Phase 8:
- **UI-FOOTER-01**: No header/back arrow anywhere + navigation usable (no dead-ends)
- **ADM-NAV-01**: Admin nav moved to top; admin footer exists without duplicating primary nav

Coverage:
- UI-FOOTER-01 → 08-01, 08-02, 08-04
- ADM-NAV-01   → 08-03

## Locked requirements (must not change)
From `08-CONTEXT.md`:
- No header and no back arrow on all pages.
- When creating footer for admin page move current admin footer items (fighters, services, schedule, bookings) to top.

## Dependency note (roadmap alignment)
ROADMAP lists Phase 8 depends on Phase 7, but Phase 7 plans are currently TBD while this plan implements the carried criteria (no header/back). Execute Phase 08 as written unless Phase 7 is introduced and scope is moved there.

## In scope
- Remove `<ion-header>` blocks from all pages (customer + admin).
- Remove `<ion-back-button>` usage (currently in fighter profile page).
- Remove any “Back” UI that acts like back navigation (admin booking detail currently uses a Back button).
- Admin shell restructure:
  - Move existing admin primary nav (currently bottom tab bar) to **top**.
  - Introduce **admin footer area** that does **not** include Fighters/Services/Schedule/Bookings.
- Routing remains functional; no dead-ends after removing header/back affordances.

## Out of scope
- Backend changes.
- Changing admin permissions/guards.
- Redesigning page content (forms/cards) beyond chrome layout updates.
- Adding new admin features; footer can be placeholder container (no new business actions required).

## Current state (evidence pointers)
- Global header/back UI comes from `app-header`:
  - `src/app/shell/header.component.html` (`<ion-header>`, `<ion-back-button>`)
  - Used by pages via `<app-header ...>`
- Some pages still render Ionic headers directly:
  - Admin: `src/app/pages/admin/admin-bookings.page.html`, `admin-schedule.page.html`, `admin-booking-detail.page.html`
- Admin “shell” route wrapper exists but currently only hosts `<router-outlet>`:
  - `src/app/pages/admin/admin-tabs.page.html`
- Customer bottom tab bar already exists (includes “Admin” entry point for admins):
  - `src/app/shell/tabs.page.html`

## Assumptions
- Project uses **Angular standalone components** + Ionic standalone imports (seen in `AdminTabsPage`).
- “No header” means **no `<ion-header>` UI** rendered (including via `<app-header>`), not “hide via CSS”.
- “No back arrow” means **remove `<ion-back-button>` and any explicit back-nav button**, and rely on routing + tab/footer nav + in-page actions.
- Admin primary navigation should remain available on **all admin pages**, including `/admin/bookings/:bookingId`.

## Risks / watchouts
- Removing headers reduces built-in safe-area padding; pages using `fullscreen="true"` may need CSS/top spacing adjustments.
- Admin nested route `/admin/bookings/:bookingId` must still feel navigable without a Back button; top admin nav must remain visible.
- Admin top nav should not use `<ion-header>`; implement as in-content bar (may need padding for safe-area).
- “No header” across auth screens (login/register) could reduce context; ensure page content still clearly labeled via existing hero sections.

---

## Step-by-step executable plan

### 08-01 — Inventory + remove headers everywhere
**Objective:** eliminate `<ion-header>` from all page templates to satisfy “no header on all pages”.

- **Files to modify (minimum set; confirm via search):**
  - `src/app/shell/header.component.html`
  - Templates using `<app-header ...>` (remove that line)
  - `src/app/pages/admin/admin-fighters.page.html`
  - `src/app/pages/admin/admin-services.page.html`
  - `src/app/pages/admin/admin-schedule.page.html`
  - `src/app/pages/admin/admin-bookings.page.html`
  - `src/app/pages/admin/admin-booking-detail.page.html`
  - `src/app/pages/booking-detail/booking-detail.page.html`
  - `src/app/pages/forgot-password/forgot-password.page.html`
  - `src/app/pages/book-placeholder/book-placeholder.page.html`
  - `src/app/pages/booking-success/booking-success.page.html`
  - `src/app/pages/payment-return/payment-return.page.html`
  - `src/app/pages/login/login.page.html`
  - `src/app/pages/register/register.page.html`
  - `src/app/pages/reset-password/reset-password.page.html`
  - `src/app/pages/profile/profile.page.html`
  - `src/app/pages/my-bookings/my-bookings.page.html`
  - `src/app/pages/catalog/catalog.page.html`
  - `src/app/pages/fighter-profile/fighter-profile.page.html` (also handled in 08-02)

- **Actions:**
  - Inventory step (make plan executable):
    - Search for headers (two sources):
      - `rg -n "<ion-header" src/app`
      - `rg -n "<app-header" src/app`
    - Treat matches as authoritative file list.
  - For each file above:
    - Remove the `<ion-header ...>...</ion-header>` block entirely.
    - Remove the `<app-header ...></app-header>` line entirely (if present).
    - Keep `<ion-content ...>` as root UI container.
    - If page relied on header title only, ensure page already has an in-content title/hero (many pages already do via `.auth-hero`, `.hero`, etc.). Do **not** add new headers.
  - For `src/app/shell/header.component.ts`:
    - Remove Ionic header/back imports not used after template change and update `imports: [...]` list.

- **Verification:**
  - Automated:
    - `npm run lint`
    - `npm run build`
    - `rg -n "<ion-header" src/app`  # expect 0 matches
    - `rg -n "<app-header" src/app`  # expect 0 matches
  - Manual smoke:
    - `npm start`
    - Navigate to: `/home`, `/explore`, fighter profile, `/my-bookings`, `/profile`, `/admin/fighters`
    - Confirm **no header bar** appears on any page.

**Done:** `rg -n "<ion-header" src/app` returns no matches.

### 08-02 — Remove back arrow / back UI on all pages
**Objective:** satisfy “no back arrow on all pages”.

- **Files to modify:**
  - `src/app/shell/header.component.html`
  - `src/app/pages/admin/admin-booking-detail.page.html`

- **Actions:**
  - Inventory step:
    - Search for Ionic back button:
      - `rg -n "<ion-back-button" src/app`
    - Search for explicit back UI/navigation triggers:
      - `rg -n "(\\bBack\\b|goBack\\(|NavController\\.back\\(|router\\.navigateBack\\(|navigateBack\\()" src/app`
    - Remove/replace any matches that render back-arrow/back navigation UI (per scope: no back arrow/UI).
  - Global header component:
    - Remove `<ion-back-button ...>` from `src/app/shell/header.component.html`.
    - Since Phase 08 removes `<app-header>` usage everywhere (08-01), this ensures no back arrow appears anywhere.
  - Admin booking detail:
    - Remove explicit Back button (`<ion-button ...>Back</ion-button>`).
    - Rely on always-visible admin top navigation (implemented in 08-03) so “Bookings” is one tap away.

- **Verification:**
  - Automated:
    - `npm run lint`
    - `npm run build`
    - `rg -n "<ion-back-button" src/app`  # expect 0 matches
  - Manual:
    - Open a fighter profile from `/explore` and confirm **no back arrow UI**.
    - Open admin booking detail (`/admin/bookings/:bookingId`) and confirm **no Back button** and no back arrow UI.

### 08-03 — Admin nav moved to top + add admin footer area (no duplicated nav)
**Objective:** move admin primary nav (Fighters/Services/Schedule/Bookings) to top; introduce admin footer without duplicating those items.

- **Files to modify:**
  - `src/app/pages/admin/admin-tabs.page.html`
  - `src/app/pages/admin/admin-tabs.page.ts`
  - `src/app/pages/admin/admin-tabs.page.scss` (as needed for layout)

- **Actions (admin shell):**
  - In `admin-tabs.page.html`:
    - Implement **admin primary nav at top** (NOT `<ion-header>`):
      - Provide 4 links/buttons to: `/admin/fighters`, `/admin/services`, `/admin/schedule`, `/admin/bookings`.
      - Highlight active route (via `routerLinkActive` or equivalent).
    - Keep `<router-outlet>` below nav so child routes render under it.
    - Add admin footer area (secondary) that contains **no Fighters/Services/Schedule/Bookings** items.
  - In `admin-tabs.page.ts`:
    - Keep Ionic + Router imports aligned with template (minimal set).

- **Routing note:**
  - No route changes required; admin routes already nested under `/admin` in `src/app/app.routes.ts`.

- **Verification:**
  - Automated:
    - `npm run lint`
    - `npm run build`
  - Manual:
    - Visit `/admin/fighters`, `/admin/services`, `/admin/schedule`, `/admin/bookings`.
    - Confirm nav items appear **at top**.
    - Confirm admin footer exists and contains **no** Fighters/Services/Schedule/Bookings items.
    - Visit `/admin/bookings/:bookingId` and confirm admin top nav still present and usable.

### 08-04 — Navigation usability sweep (no dead-ends)
**Objective:** ensure removing header/back UI did not trap user on any page.

- **Files to modify:** only if issues found during sweep (likely CSS/layout fixes)
  - `src/global.scss` and/or `src/theme/variables.scss` (only if safe-area/padding regressions)
  - Individual page `.scss` files if content becomes clipped under status bar

- **Actions:**
  - Walk key user flows:
    - Customer: home → explore → fighter profile → book placeholder → booking detail → payment return → booking success → my bookings → booking detail
    - Admin: admin fighters/services/schedule/bookings → booking detail
  - Fix any layout issues caused by header removal:
    - Prefer adding padding to content containers/classes already used (`.auth-shell`, `.profile-shell`, etc.)
    - Avoid reintroducing header components.

- **Verification:**
  - Automated:
    - `npm run lint`
    - `npm run build`
  - Manual:
    - Confirm each page has clear navigation escape via tabs/footer links or explicit in-page action buttons (not back arrow).

---

## Verification checklist (definition of done)
- [ ] No `<ion-header>` rendered on any page (customer + admin).
- [ ] No `<ion-back-button>` anywhere.
- [ ] No explicit “Back” navigation UI remains (admin booking detail).
- [ ] Admin primary nav (Fighters/Services/Schedule/Bookings) appears at **top** on all admin pages.
- [ ] Admin footer exists and contains **no** Fighters/Services/Schedule/Bookings items.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Manual smoke: key customer + admin flows navigable without dead-ends.

