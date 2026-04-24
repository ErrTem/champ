# Phase 4: Payments & confirmation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `04-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-24  
**Phase:** 04-payments-confirmation  
**Areas discussed:** Checkout style, Checkout contract, Webhooks & state transitions, Return UX

---

## Checkout style

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Checkout (redirect) | Hosted Stripe payment page, lowest app-side complexity | ✓ |
| Embedded payment form | Stripe Payment Element embedded in app | |
| You decide | Pick simplest safe default | |

**User's choice:** Stripe Checkout (redirect)  

| Option | Description | Selected |
|--------|-------------|----------|
| Card only | Minimal v1 surface | ✓ |
| Card + wallets | Apple Pay / Google Pay where available | |
| You decide | Reasonable defaults | |

**User's choice:** Card only

---

## Checkout contract (session creation)

| Option | Description | Selected |
|--------|-------------|----------|
| Create session from “Booking reserved” screen | User taps “Pay now” after booking exists | ✓ |
| Create immediately on booking create | Auto-start checkout right after reserve | |
| You decide | — | |

**User's choice:** Create session from “Booking reserved” screen

| Option | Description | Selected |
|--------|-------------|----------|
| One active session per booking | Recreate only if expired/canceled | ✓ |
| New session every click | Always create a fresh session | |
| You decide | — | |

**User's choice:** One active session per booking

| Option | Description | Selected |
|--------|-------------|----------|
| bookingId only | Minimal metadata; webhook maps via bookingId | ✓ |
| bookingId + slotId + userId | More direct mapping; more duplication/PII | |
| You decide | — | |

**User's choice:** bookingId only

| Option | Description | Selected |
|--------|-------------|----------|
| Amount from DB service price | Authoritative at checkout time | ✓ |
| Amount from booking snapshot | Locks price at booking create time | |
| You decide | — | |

**User's choice:** Amount from DB service price

---

## Webhooks + booking confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| `checkout.session.completed` | Confirm on checkout completion | ✓ |
| `payment_intent.succeeded` | Confirm on payment intent success | |
| You decide | — | |

**User's choice:** `checkout.session.completed`

| Option | Description | Selected |
|--------|-------------|----------|
| Keep awaiting until TTL expiry | Cancel return doesn’t change booking status | ✓ |
| Cancel immediately | Cancel booking on cancel-return | |
| You decide | — | |

**User's choice:** Keep awaiting until TTL expiry

| Option | Description | Selected |
|--------|-------------|----------|
| Store Stripe `event.id` | Persist processed events and ignore duplicates | ✓ |
| Booking state only | Rely on safe transitions without event table | |
| You decide | — | |

**User's choice:** Store Stripe `event.id`

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmed booking consumes slot | Set `confirmedBookingId`, clear reservation fields | ✓ |
| Delete slot | Remove slot record after confirmation | |
| You decide | — | |

**User's choice:** Confirmed booking consumes slot (do not delete slot)

---

## Return UX

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated success screen | Align to `src/design/booking_success/code.html` | ✓ |
| Reuse booking page | Just swap status in-place | |
| You decide | — | |

**User's choice:** Dedicated success screen

| Option | Description | Selected |
|--------|-------------|----------|
| Pending state + polling | “Confirming…” then poll briefly; fallback guidance | ✓ |
| Optimistic confirmed | Show confirmed immediately on return | |
| You decide | — | |

**User's choice:** Pending state + polling

| Option | Description | Selected |
|--------|-------------|----------|
| Return to booking with retry CTA | Still awaiting payment; user can try again | ✓ |
| Dedicated cancelled screen | Separate “Payment cancelled” page | |
| You decide | — | |

**User's choice:** Return to booking with retry CTA

---

## Claude's Discretion

- None explicitly requested.

## Deferred Ideas

- Notifications/email confirmation (Phase 5)
- Stripe Connect/payouts (v2)

