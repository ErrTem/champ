# Phase 10: Booking UX + rules fixes — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` (R6) + `.planning/todos/pending/2026-04-26-booking-ux-rules-fixes.md`

<domain>
## Phase Boundary

Deliver booking UX + rules improvements across frontend (Ionic/Angular) + backend (NestJS):

- `/explore` (Catalog):
  - working filters: price range + training type
  - filters wired UI ↔ URL/query params ↔ API ↔ UI state
- `/book` (Booking calendar):
  - calendar layout improvements: month selector on top + arrows to switch month + month schedule below
- Booking rule:
  - cannot book earlier than 24 hours before session start
  - enforced server-side; UI renders clear actionable error

Out of scope for Phase 10:

- OAuth/registration work (Phase 9)
- Gyms + multi-timezone (Phase 11)
- Fighter self-serve, notifications, social

</domain>

<decisions>
## Implementation Decisions (Locked)

### Explore filters contract
- Filters must persist in URL (query params) and be restored on load/back navigation.
- Filters must affect results (no cosmetic-only chips).

### Filter semantics (v1)
- **Price range**: filter fighters by published services that match price range (USD cents).
- **Training type**: filter fighters by:
  - discipline(s) (e.g. Boxing, MMA) via `Fighter.disciplines`, and/or
  - modality (online / in_person) via `Service.modality`
- Backend must treat missing filters as “no filtering”.

### Booking 24h rule (API contract)
- Enforce in `POST /bookings` (server-side).
- Error contract: `400` with stable `{ code, message }` body.
  - Proposed code: `BOOKING_TOO_SOON`
  - Message must be user-facing enough to display directly (or mapped to UI copy).

### Calendar UX
- Keep current booking flow steps (`select` → `review` → `created`) and URL preservation pattern.
- Rework only calendar selection UI/layout; do not change booking/payment primitives unless needed.

</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/REQUIREMENTS.md` — R6 acceptance criteria
- `.planning/todos/pending/2026-04-26-booking-ux-rules-fixes.md`

### Current Explore implementation
- `src/app/pages/catalog/catalog.page.html`
- `src/app/pages/catalog/catalog.page.ts`
- `src/app/core/services/catalog.service.ts`
- `backend/src/fighters/fighters.controller.ts`
- `backend/src/fighters/fighters.service.ts`

### Current booking calendar + booking create
- `src/app/pages/book-placeholder/book-placeholder.page.html`
- `src/app/pages/book-placeholder/book-placeholder.page.ts`
- `src/app/core/services/booking.service.ts`
- `backend/src/bookings/bookings.controller.ts`
- `backend/src/bookings/bookings.service.ts`

</canonical_refs>

<notes>
## Notes / Constraints

- Frontend already parses booking create errors into `{ status, code, message }` shape (`BookingService`), so adding a new backend error code should be low-friction.
- Current `/book` UI uses `DISPLAY_TIMEZONE = 'America/Los_Angeles'` and `HORIZON_DAYS = 30`; Phase 11 may revisit timezone model, but Phase 10 should not expand scope.

</notes>

---

*Phase: 10-booking-ux-rules-fixes*  
*Context gathered: 2026-04-26*
