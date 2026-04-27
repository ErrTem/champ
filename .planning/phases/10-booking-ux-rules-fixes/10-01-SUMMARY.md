# Phase 10 (Plan 01) Summary — Booking UX + rules fixes

## Shipped

### Backend
- **`GET /fighters` filters**:
  - Optional query params: `minPriceCents`, `maxPriceCents`, repeated `discipline`, repeated `modality` (`online|in_person`)
  - Semantics:
    - discipline filter uses fighter `disciplines hasSome`
    - service-level constraints (price/modality) use single `services.some` clause (AND within one published service)
- **`POST /bookings` 24h rule**:
  - Enforced server-side before booking creation
  - Stable error contract: `400 { code: 'BOOKING_TOO_SOON', message }`

### Frontend
- **Explore filters** (`/explore`):
  - Discipline chip updates URL query params and refetches results
  - Training type (modality) + price bucket controls update URL query params and refetch
  - Reload + back/forward restores state via query params subscription
  - Mock mode uses same filter semantics in-memory
- **Booking calendar** (`/book`, select step):
  - Month bar with arrows
  - Month grid view (days outside 30-day horizon disabled)
  - Booking step/URL preservation unchanged
- **Booking error UI**:
  - `BOOKING_TOO_SOON` maps to actionable “Too soon to book” panel

## Verification

### Automated (required)
- `cd backend; npm test -- fighters.filters.e2e-spec.ts`
- `cd backend; npm test -- bookings.24h-rule.e2e-spec.ts`

### Manual smoke (recommended)
- Explore: filters change results, persist in URL, reload/back restores
- Book: month nav works, selecting day updates slots, booking flow steps unchanged
- 24h rule: API returns `BOOKING_TOO_SOON`, UI shows clear error + lets user pick later slot

