# Phase 8: Routing + app shell navigation — Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Source:** ROADMAP.md + pending todos

<domain>
## Phase Boundary

Deliver: navigation/routing cleanup in Ionic + Angular app:

- Remove/disable Home page (stop duplicating auth/profile entrypoints)
- Default landing route `/explore` (also post-login default)
- Unknown URLs redirect to `/explore`
- Explicit back arrow top-left on all primary pages (shared pattern)
- Persistent bottom footer/tab navigation: Explore / Bookings / Profile / Admin
  - Admin tab only visible for admin users
- Deep links land correct tab; back behavior remains sane

Out of scope for Phase 8:

- Registration upgrades (Phase 9)
- Booking UX/rules work (Phase 10)
- Gyms/timezone, fighter self-serve, notifications, social

</domain>

<decisions>
## Implementation Decisions (Locked)

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements / phase drivers
- `.planning/ROADMAP.md` — Phase 8 definition
- `.planning/REQUIREMENTS.md` — R3 + R4 acceptance criteria
- `.planning/todos/pending/2026-04-26-routing-nav-cleanup.md` — routing/back button items
- `.planning/todos/pending/2026-04-26-bottom-footer-nav.md` — footer nav items

### App shell / routing implementation
- `frontend/` (Ionic + Angular routing + tabs) — locate routes, guards, and shell layout

</canonical_refs>

<specifics>
## Specific Ideas

- Prefer single place to define:
  - default route
  - wildcard redirect
  - post-login redirect rules (`returnTo` handling)
- Back button should be consistent:
  - appears where meaningful
  - does not break tab navigation history

</specifics>

<deferred>
## Deferred Ideas

None — Phase 8 scope fully captured above.

</deferred>

---

*Phase: 08-routing-app-shell-navigation*
*Context gathered: 2026-04-26*
