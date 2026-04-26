# Phase 10: Booking UX + rules fixes — Research

**Created:** 2026-04-26  
**Status:** draft

## Baseline (code verified)

### `/explore` (Catalog)
- UI renders chips + “Refine” and “Price range” pills, but they are **static** (no click handlers, no query state).
  - `src/app/pages/catalog/catalog.page.html`
  - `src/app/pages/catalog/catalog.page.ts`
- Client fetch uses `CatalogService.getFighters()` with no query params.
  - `src/app/core/services/catalog.service.ts`
- Backend `GET /fighters` returns published fighters sorted by name; includes `disciplines` + computed `fromPriceCents` (min across published services).
  - `backend/src/fighters/fighters.controller.ts`
  - `backend/src/fighters/fighters.service.ts`

Implication: working filters require changes in **both** client + backend API contract.

### `/book` (Booking calendar)
- Booking flow is implemented in `BookPlaceholderPage` with steps (`select`/`review`/`created`) and strong URL preservation patterns (`fighterId`, `serviceId`, `date`, `slotId`, `step`).
  - `src/app/pages/book-placeholder/book-placeholder.page.ts`
- Calendar UI currently shows:
  - a month label (derived from first horizon day) in hero
  - a fixed 30-day horizon grid, with Mon–Sun headers
  - does **not** provide month navigation or month selector
  - `DISPLAY_TIMEZONE` hardcoded to `America/Los_Angeles` and used for formatting + bucketing.

### Booking create (`POST /bookings`)
- Backend `BookingsService.createBooking()`:
  - reads slot by id
  - creates `booking` (awaiting_payment) with expiry
  - reserves slot via conditional update with TTL semantics
  - returns booking DTO
  - no 24h-before-start validation
  - `backend/src/bookings/bookings.service.ts`
- Controller standardizes concurrency conflicts to `409 { code: SLOT_UNAVAILABLE, message }`.
  - `backend/src/bookings/bookings.controller.ts`
- Frontend `BookingService.createBooking()` already extracts `code` and `message` from API errors.
  - `src/app/core/services/booking.service.ts`

Implication: 24h rule should be enforced in backend service (single source of truth) with a stable error code, then surfaced in `BookPlaceholderPage` reserve error UI.

## Proposed contracts (for planning)

### Explore filters API (minimal)

Extend `GET /fighters` to accept optional query params:

- `minPriceCents` (number)
- `maxPriceCents` (number)
- `discipline` (repeatable) or `disciplines` (comma list)
- `modality` (repeatable) for service modality: `online|in_person`

Backend semantics: filter fighters by **published services** matching price/modality constraints, and optionally by fighter disciplines.

Client semantics: encode selected filters into URL query params; on load, parse and set UI state; on change, update URL and refetch results.

### Booking 24h rule API

Enforce \(slot.startsAtUtc - nowUtc \ge 24h\).

On violation, return:

- `400` with body `{ code: 'BOOKING_TOO_SOON', message: 'Bookings must be made at least 24 hours in advance.' }`

Frontend maps this to a dedicated “too soon” reserve error panel with guidance (pick later time / different day).

---

Notes: Phase 11 introduces gym timezones; Phase 10 should keep rule in UTC based on stored slot starts, with copy that does not promise a specific timezone framing.
