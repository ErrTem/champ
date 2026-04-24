---
phase: 04-payments-confirmation
plan: 02
status: complete
date: 2026-04-24
---

## Summary
- Added a Stripe-backed checkout-session flow for `awaiting_payment` bookings with **DB-authoritative pricing** and **one active session per booking** reuse.
- Extended `Booking` persistence with `stripeCheckoutSessionId` and covered core PAY-01 behavior with backend tests (no outbound Stripe calls).

## Key files
- `backend/prisma/schema.prisma`
- `backend/src/payments/payments.module.ts`
- `backend/src/payments/payments.controller.ts`
- `backend/src/payments/payments.service.ts`
- `backend/src/payments/stripe.client.ts`
- `backend/test/payments.checkout-session.e2e-spec.ts`

## Verification
- `cd backend && npm test`
- `cd backend && npx prisma db push --accept-data-loss`

