# Requirements: Champ — v1.1 (Milestone 2)

Milestone goal: close v1 verification gaps + ship next UX/ops improvements from pending todos.

## In Scope

### R1 — Close deferred human verification gaps (v1 carryover)
- **Description**: finish pending scenarios in Phase 01 + Phase 03 UAT/verification.
- **Source**: `.planning/STATE.md` Deferred Items.
- **Acceptance**:
  - Phase 01 UAT/verification moved from partial/human_needed → passed/complete.
  - Phase 03 UAT/verification moved from partial/human_needed → passed/complete.
- **Status**: pending
- **Notes (2026-04-26)**:
  - Phase 01: iOS auth persistence (D-06) still pending (no iPhone/mac available yet).
  - Phase 03: booking flow works after reentering app; reserved slot disappears after reserve; concurrency smoke PASS. Still pending: returnTo preservation + explicit timezone/day-boundary spot-check.

### R2 — Requirements bookkeeping restore
- **Description**: reintroduce milestone-scoped `REQUIREMENTS.md` with traceability statuses (this doc) and keep it updated per phase transition.
- **Source**: `.planning/PROJECT.md` Active.
- **Acceptance**:
  - `REQUIREMENTS.md` exists, scoped to v1.1, with statuses updated as phases complete.
- **Status**: in_progress

### R3 — Routing defaults + remove Home + shared back navigation
- **Description**:
  - remove/disable Home page
  - default landing route `/explore` (also post-login default)
  - unknown URLs redirect to `/explore`
  - explicit back arrow top-left on all pages (shared pattern)
- **Source**: `.planning/todos/pending/2026-04-26-routing-nav-cleanup.md`
- **Acceptance**:
  - Visiting `/` lands on `/explore`.
  - Visiting unknown route lands on `/explore`.
  - All primary pages render consistent header with working back affordance.
- **Status**: pending

### R4 — Bottom footer navigation (Explore / Bookings / Profile / Admin)
- **Description**: persistent footer tab bar; Admin tab only for admin users.
- **Source**: `.planning/todos/pending/2026-04-26-bottom-footer-nav.md`
- **Acceptance**:
  - Tab bar always visible in authenticated app shell.
  - Admin tab hidden unless admin.
  - Deep links land in correct tab + back behavior stays sane.
- **Status**: pending

### R5 — Registration upgrades (OAuth, phone mask, terms, roles, fighter approval)
- **Description**:
  - Google + Apple OAuth login/registration
  - phone field with USA prefix + input mask
  - required 18+ checkbox
  - required terms checkbox + mock Terms page
  - choose profile type: fighter vs regular user
  - fighter accounts pending until admin approval
- **Source**: `.planning/todos/pending/2026-04-26-registration-upgrades.md`
- **Acceptance**:
  - User can sign up/sign in with Google and Apple.
  - Registration blocks submit unless phone valid + both checkboxes checked.
  - Terms route exists and linked.
  - Fighter registration creates pending fighter account; UI communicates pending; backend enforces pending restrictions.
  - Admin can approve fighter accounts.
- **Status**: pending

### R6 — Booking UX + rules (filters, calendar UI, 24h rule)
- **Description**:
  - `/explore` filters: price range + training type filters; wired UI ↔ query params ↔ API ↔ UI state
  - `/book` calendar UI layout improvements
  - rule: cannot book earlier than 24h before session start (server-side enforcement + UI error)
- **Source**: `.planning/todos/pending/2026-04-26-booking-ux-rules-fixes.md`
- **Acceptance**:
  - Filters change results and persist in URL/query state.
  - Calendar UI matches requested layout (month selector + arrows; month schedule below).
  - Booking attempts violating 24h rule rejected by API with clear error; UI displays it.
- **Status**: pending

### R7 — Gyms domain + multi-timezone support
- **Description**:
  - introduce `Gym` (name, address, timezone, map links)
  - associate fighters to gym
  - slot generation + display uses gym timezone
  - show gym address + “show on map” opens maps app/site
- **Source**: `.planning/todos/pending/2026-04-26-gyms-and-timezones.md`
- **Acceptance**:
  - Gym entity exists; fighter → gym relation stored.
  - Times shown in correct gym timezone; booking stored unambiguously.
  - UI shows address + opens Google/Apple Maps link.
- **Status**: pending

### R8 — Fighter self-serve (schedule, services, cancel bookings)
- **Description**:
  - fighter can edit own schedule + services
  - fighter can cancel bookings (rule + notifications; refund policy defined if needed)
- **Source**: `.planning/todos/pending/2026-04-26-fighter-self-serve.md`
- **Acceptance**:
  - Fighter-authenticated endpoints enforce ownership.
  - UI screens exist for schedule/services management.
  - Cancellation updates booking state + notifies user (and payment handling if applicable).
- **Status**: pending

### R9 — Notifications + calendar sync
- **Description**:
  - push notifications + reminders (example 24h before)
  - fighter notifications on new bookings
  - calendar sync (ICS export or integration)
- **Source**: `.planning/todos/pending/2026-04-26-notifications-calendar-sync.md`
- **Acceptance**:
  - Reminders can be scheduled; at least one reminder type shipped.
  - Fighter receives notification on booking creation.
  - User can add booking to calendar (ICS minimum).
- **Status**: pending

### R10 — Social sharing + social links on fighter profile
- **Description**:
  - optional fighter social link fields
  - share buttons on fighter profile (share sheet / deep links)
- **Source**: `.planning/todos/pending/2026-04-26-social-integrations-sharing.md`
- **Acceptance**:
  - Social links render when present.
  - Share action works on web/PWA target (copy link minimum; share sheet where available).
- **Status**: pending

## Out of Scope (v1.1)
- Native mobile apps
- Multi-tenant payouts
- Real-time chat
- Recurring subscriptions

---
Last updated: 2026-04-26
