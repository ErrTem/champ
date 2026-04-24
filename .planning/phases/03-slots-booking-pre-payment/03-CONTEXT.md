# Phase 3: Slots & booking (pre-payment) - Context

**Gathered:** 2026-04-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Authenticated users can (1) view real availability for a selected fighter + service, then (2) create a booking in an **awaiting-payment** state with **server-enforced protection against double-booking**.

Out of scope: taking payment, confirming bookings via webhooks, notifications, admin schedule management UI (those are later phases).

</domain>

<decisions>
## Implementation Decisions

### Availability UX (calendar + times)

- **D-01:** Slot picking UI is **calendar month view → pick a day → pick a time**, aligned to `src/design/select_date_time/code.html`.
- **D-02:** Users can browse **the next 30 days** of availability.
- **D-03:** For a chosen day, available times are shown in **time-of-day buckets** (Morning / Evening; optionally add Afternoon if needed) rather than one long list.

### Timezone policy (California-only)

- **D-04:** Treat availability and displayed times as **America/Los_Angeles** (Pacific Time). UI does **not** need to show a timezone label in v1.
- **D-05:** **Store timestamps in UTC** server-side and convert to/from America/Los_Angeles at the API boundary per the documented policy.

### Booking creation contract (pre-payment)

- **D-06:** Booking creation **requires login**. If user is not authenticated, route to `/login` and then return to the booking flow with the selection preserved (fighterId/serviceId/date/slot).
- **D-07:** The availability API must return a **server-issued `slotId`**, and the create-booking API accepts that `slotId` (not raw start/end timestamps) to support concurrency-safe booking.
- **D-08:** Creating a booking places it into **awaiting-payment** (or equivalent) and **reserves the slot for a short TTL** (target: ~10–15 minutes) before expiring if unpaid.
- **D-09:** If a slot is stale/unavailable at create time, show a **friendly error** and **refresh availability for that day** without kicking the user back to the month view.

### Carry-forward constraints (must remain compatible)

- **D-10:** Auth/session remains cookie-based (httpOnly refresh strategy). All booking/availability API calls continue using `withCredentials: true` and the existing refresh-on-401 interceptor behavior.
- **D-11:** UI must stay within Ionic/Angular component conventions (no Tailwind adoption in app code) and follow `DESIGN.md` (“no-line rule”, tonal layering).

### Claude's Discretion

- Exact slot duration rendering (e.g., show end time derived from service duration) as long as it’s consistent and unambiguous.
- Exact bucket cutoffs (e.g., Morning < 12:00) and whether to include “Afternoon”.
- Exact hold TTL value and expiration job strategy, as long as holds expire reliably and are enforced server-side.
- Exact booking status enum naming, as long as it supports at least: awaiting payment, confirmed (Phase 4), cancelled, expired.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope / acceptance

- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and plan breakdown (03-01 … 03-04).
- `.planning/REQUIREMENTS.md` — CAL-01…CAL-03 and BKG-01…BKG-03 acceptance criteria (timezone + concurrency + statuses).
- `.planning/PROJECT.md` — Core value and constraints (backend authoritative holds, boring/debuggable stack).

### Design contract (source of truth for look/feel)

- `DESIGN.md` — “Kinetic Gallery” rules (no 1px borders; depth via tonal layering).
- `src/design/select_date_time/code.html` — Slot selection visual direction (month calendar + time grid + buckets).
- `src/design/booking_summary/code.html` — Booking review layout direction (used in Phase 3 pre-pay confirmation step, Phase 4 for payment).
- `src/design/booking_success/code.html` — Success screen direction (Phase 4+).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Frontend selection entry already exists: `FighterProfilePage` navigates to `/book?fighterId=...&serviceId=...` (`src/app/pages/fighter-profile/fighter-profile.page.ts`).
- Placeholder “Book” page loads the selected fighter/service via `CatalogService` (`src/app/pages/book-placeholder/book-placeholder.page.ts`).
- Auth client + refresh on 401 are already established (`src/app/core/services/auth.service.ts`, `src/app/core/interceptors/auth.interceptor.ts`).

### Established Patterns

- API calls use Angular `HttpClient` with `withCredentials: true` (cookie auth).
- Pages are Ionic standalone components with SCSS styling and the design system principles (tonal layering).

### Integration Points

- Add Phase 3 routes under a booking flow (replacing or extending `/book` placeholder) in `src/app/app.routes.ts`.
- Backend is NestJS + Prisma; add new domain modules for schedule/availability and booking creation.

</code_context>

<specifics>
## Specific Ideas

- California-only constraint means “timezone complexity” is intentionally reduced in v1: schedule + display in Pacific Time, UTC storage internally.

</specifics>

<deferred>
## Deferred Ideas

- Payments + confirmation + webhooks — Phase 4.
- My bookings list/detail + notifications — Phase 5.
- Admin schedule management UI — Phase 6.

</deferred>

---

*Phase: 03-slots-booking-pre-payment*  
*Context gathered: 2026-04-24*
