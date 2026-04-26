---
phase: 08-routing-app-shell-navigation
plan: 01
completed: 2026-04-26
duration: "n/a"
requirements-completed: [R3, R4]
key-files:
  created:
    - src/app/shell/tabs.page.ts
    - src/app/shell/tabs.page.html
    - src/app/shell/tabs.page.scss
  modified:
    - src/app/app.routes.ts
    - src/app/core/guards/auth.guard.ts
    - src/app/pages/login/login.page.ts
    - src/app/pages/admin/admin-tabs.page.ts
    - src/app/pages/admin/admin-tabs.page.html
---

# Phase 8 Plan 01: Routing + tabs shell summary

Built authenticated app shell via `TabsPage` with persistent footer nav (Explore/Bookings/Profile + Admin gated). Replaced Home default with `/explore`, added wildcard redirect, preserved attempted URL via `returnTo`, and hardened login redirect to avoid open redirect (`//...`).

## What changed

- Tabs shell: `src/app/shell/tabs.page.*`
  - Bottom `ion-tab-bar` routes to `/explore`, `/bookings`, `/profile`
  - Admin tab only when `user()?.isAdmin === true`
- Routing: `src/app/app.routes.ts`
  - `/` → `/explore`
  - `**` → `/explore`
  - Legacy redirects:
    - `/fighters/:fighterId` → `/explore/fighters/:fighterId`
    - `/my-bookings` → `/bookings`
  - `/home` now redirects to `/explore` (no longer entrypoint)
- Auth redirect: `src/app/core/guards/auth.guard.ts`
  - unauth → `/login?returnTo=<attempted-url>`
- Login redirect safety: `src/app/pages/login/login.page.ts`
  - accept `returnTo` only when starts with `/` and not `//`
  - default success route `/explore`
- Admin nested tabs removed: `src/app/pages/admin/admin-tabs.page.*`
  - removed inner `<ion-tabs>`/`<ion-tab-bar>`; now plain routed outlet container

## Verification

- `npm test -- --watch=false` PASS

## Deviations from Plan

None - plan executed exactly as written.

