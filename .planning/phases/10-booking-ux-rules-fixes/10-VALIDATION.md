# Phase 10: Booking UX + rules fixes — Validation

**Created:** 2026-04-26  
**Status:** draft

## Automated

Backend:
- Add/extend e2e coverage:
  - `GET /fighters` filters (price range + discipline + modality) return correct subsets
  - `POST /bookings` rejects booking within 24h with stable `400 { code: BOOKING_TOO_SOON }`

Frontend:
- Unit/integration specs optional; prioritize backend e2e + manual smoke due to UI-heavy changes.

## Manual smoke checklist (phase gate)

### Explore filters
- Price range filter changes results and persists in URL query params.
- Training type filter(s) changes results and persists in URL query params.
- Reload page preserves filters and results match.
- Back/forward navigation restores prior filter states and results.

### Booking calendar UI
- Month selector visible at top; arrows change month.
- Month schedule renders below; selecting day updates available times as before.
- Existing URL preservation (returnTo after login; deep link with `date/slotId/step`) still works.

### 24h booking rule
- Attempt to reserve a slot < 24h from now:
  - API returns `400` with clear message and stable code
  - UI displays clear error and allows user to pick another slot/day
