---
phase: 04-payments-confirmation
plan: 04
status: complete
date: 2026-04-24
---

## Summary
- Added frontend API methods for booking polling and checkout-session creation.
- Implemented “Pay now” CTA on the awaiting-payment booking state and redirects to Stripe Checkout.
- Added payment return handler (`/pay/return`) that polls booking status and routes to a success screen (`/booking/success`) once confirmed.

## Key files
- `src/app/app.routes.ts`
- `src/app/core/services/booking.service.ts`
- `src/app/pages/book-placeholder/book-placeholder.page.ts`
- `src/app/pages/book-placeholder/book-placeholder.page.html`
- `src/app/pages/payment-return/payment-return.page.ts`
- `src/app/pages/booking-success/booking-success.page.ts`

## Verification
- `npm test`

