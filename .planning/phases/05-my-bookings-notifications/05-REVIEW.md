---
phase: 05-my-bookings-notifications
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - backend/src/bookings/bookings.controller.ts
  - backend/src/bookings/bookings.service.ts
  - backend/src/bookings/dto/booking.dto.ts
  - backend/src/notifications/notifications.module.ts
  - backend/src/notifications/notifications.service.ts
  - backend/src/payments/payments.service.ts
  - backend/test/bookings.my-bookings.e2e-spec.ts
  - backend/test/notifications.booking-status.e2e-spec.ts
  - backend/test/payments.checkout-session.e2e-spec.ts
  - backend/test/helpers/test-app.ts
  - backend/test/helpers/test-db.ts
  - backend/jest.config.ts
  - src/app/app.routes.ts
  - src/app/core/services/booking.service.ts
  - src/app/pages/my-bookings/my-bookings.page.ts
  - src/app/pages/my-bookings/my-bookings.page.html
  - src/app/pages/booking-detail/booking-detail.page.ts
  - src/app/pages/booking-detail/booking-detail.page.html
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Bookings + notifications + payments flow looks coherent (auth-scoped reads, booking hold expiry, Stripe session reuse, idempotent webhook persistence, UI routes align with deep links). Main risks: (1) Stripe webhook idempotency `catch { return; }` masks non-duplicate DB failures, (2) slot confirmation update missing reservation guard, (3) dev-email logs contain PII, (4) frontend price formatting drops cents.

## Warnings

### WR-01: Stripe webhook idempotency catch too broad (masks DB failures)

**File:** `backend/src/payments/payments.service.ts:94-102`
**Issue:** `catch { return; }` treats *any* failure of `stripeWebhookEvent.create(...)` as “duplicate event id”, silently skipping processing when DB unavailable / permission error / migration mismatch, etc. That turns real operational failures into “success” and can drop confirmations.
**Fix:** Catch only unique-constraint duplicate for `stripeEventId` (Prisma `P2002`), rethrow others.

Example:

```ts
import { Prisma } from '@prisma/client';

try {
  await this.prisma.stripeWebhookEvent.create({ data: { stripeEventId: event.id, type: event.type } });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return;
  throw e;
}
```

### WR-02: Slot confirmation update missing reservation guard (possible cross-booking consume)

**File:** `backend/src/payments/payments.service.ts:138-148`
**Issue:** Slot update confirms the slot by `id` with only `confirmedBookingId` guard. It does **not** ensure slot was reserved for this booking (`reservedBookingId === booking.id`) or at least is still reserved/unreserved. In edge cases (data corruption, manual admin edits, future code paths), this can confirm a slot for a booking that doesn’t hold it.
**Fix:** Add an additional `where` constraint (recommended: `reservedBookingId: booking.id`) or, if you intentionally allow “late confirmation”, assert slot belongs to booking via booking.slotId + reserved booking match before confirming.

Example:

```ts
await tx.slot.updateMany({
  where: {
    id: booking.slotId,
    reservedBookingId: booking.id,
    OR: [{ confirmedBookingId: null }, { confirmedBookingId: booking.id }],
  },
  data: { confirmedBookingId: booking.id, reservedBookingId: null, reservedUntilUtc: null },
});
```

### WR-03: Dev-email log payload includes PII (email) in application logs

**File:** `backend/src/notifications/notifications.service.ts:27-58`
**Issue:** `emitDevEmail` logs JSON including `to` email and booking metadata. Even for “dev-email via logs”, this is a common PII leak path (logs shipped to third parties / retained too long). Also log injection risk if email contains unexpected characters (rare but possible).
**Fix:** In non-local envs, redact or omit `to`, and log only minimal identifiers (eventType, bookingId). Alternatively, gate behind `NODE_ENV === 'development'` / dedicated `DEV_EMAIL_LOGS=1`.

Example:

```ts
const isDevLogs = process.env.NODE_ENV !== 'production' && process.env.DEV_EMAIL_LOGS === '1';
if (isDevLogs) this.logger.log(/* full payload */);
else this.logger.log(`[DEV EMAIL] ${JSON.stringify({ eventType, bookingId })}`);
```

### WR-04: Price formatting drops cents (incorrect display)

**File:** `src/app/pages/booking-detail/booking-detail.page.ts:87-93`
**Issue:** `Math.round(priceCents / 100)` rounds to whole dollars; `$12.34` displays as `$12`. This user-facing correctness bug.
**Fix:** Format cents properly (2 decimals) and use `Intl.NumberFormat` to respect currency.

Example:

```ts
formatPrice(priceCents: number | undefined, currency: string | undefined): string {
  if (typeof priceCents !== 'number') return '—';
  const cur = currency || 'USD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(priceCents / 100);
}
```

## Info

### IN-01: `resetTestDb` uses `$executeRawUnsafe` (acceptable here, keep fenced)

**File:** `backend/test/helpers/test-db.ts:8-20`
**Issue:** `$executeRawUnsafe` is correct for static TRUNCATE in tests, but name invites copy/paste into prod code paths.
**Fix:** Keep this helper test-only; consider adding a small “test-only” guard (e.g., assert `NODE_ENV === 'test'`) to prevent accidental reuse.

### IN-02: Duplicate helper `cookieHeaderFromSetCookie` in tests (minor drift risk)

**File:** `backend/test/bookings.my-bookings.e2e-spec.ts:6-15`, `backend/test/notifications.booking-status.e2e-spec.ts:8-17`
**Issue:** Same helper duplicated; small risk future drift across suites.
**Fix:** Move to `backend/test/helpers/cookies.ts` and import in both.

### IN-03: Booking DTO has many optional top-level fields (client contract ambiguity)

**File:** `backend/src/bookings/dto/booking.dto.ts:24-38`, `src/app/pages/booking-detail/booking-detail.page.html:29-44`
**Issue:** UI falls back between `data.startsAtUtc` and `data.slot?.startsAtUtc`. This works, but contract ambiguity increases chance of regressions if backend changes shape.
**Fix:** Prefer a single consistent contract: either always include `startsAtUtc/endsAtUtc` on detail DTO, or always rely on nested `slot`.

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
