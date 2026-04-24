---
phase: 4
slug: 04-payments-confirmation
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-24
reviewed_at: 2026-04-24T00:00:00Z
---

# Phase 4 — UI Design Contract (Payments & confirmation)

> Visual and interaction contract for Phase 4 payment entry + return UX in the Ionic/Angular app.  
> **Hard constraints:** Ionic/Angular only (no Tailwind), `DESIGN.md` “No-Line Rule”, cookie-based auth (`withCredentials: true`), and Phase 3 booking flow route contract remains compatible.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Ionic (ion-*) |
| Icon library | Ionicons (via `ion-icon`) |
| Font | Inter (display/headlines) + Manrope (body/labels) |

**Canonical design references (visual direction):**
- `DESIGN.md` — “Kinetic Gallery” rules (no-line rule, tonal layering, glass/gradient)
- `src/design/booking_summary/code.html` — booking summary layout direction (pay entry lives on the “reserved/awaiting payment” status screen)
- `src/design/booking_success/code.html` — booking success screen direction
- `.planning/phases/03-slots-booking-pre-payment/03-UI-SPEC.md` — prior booking flow UI contract (must remain visually consistent)

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | icon gaps, tight inline padding |
| sm | 8px | compact element spacing |
| md | 16px | default padding and gaps |
| lg | 24px | section padding, card padding |
| xl | 32px | layout gaps, hero separation |
| 2xl | 48px | major section breaks |
| 3xl | 64px | page-level breathing room |

Exceptions: none (touch targets still must be ≥ 44px height)

---

## Typography

Constrain to the same Phase 3 roles (do not introduce new roles).

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 12px | 400 | 1.2 |
| Heading | 24px | 800 | 1.15 |
| Display | 44px (responsive clamp 40–56) | 800 | 1.05 |

Letter-spacing:
- Display/Heading: -0.02em to -0.04em
- Label: +0.20em to +0.30em, uppercase

---

## Color

Follow `DESIGN.md` + Phase 3 palette. Do not introduce new neutrals.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#131313` | app background, base canvas |
| Secondary (30%) | `#1b1b1b` / `#0e0e0e` / `#353535` | cards/wells/elevations via tonal layering |
| Accent (10%) | `#ff5540` (paired with `#ffb4a8` in gradients) | **primary CTA gradient**, confirmed highlights only |
| Destructive | `#ffb4ab` | destructive/error only (prefer Ionic `danger` token) |

Accent reserved for (explicit):
- Primary CTA background gradient (135° `#ffb4a8` → `#ff5540`) and its warm glow shadow
- “Confirmed” status emphasis (chip/icon/glow) on success screen
- Primary progress affordance on “Confirming…” state (spinner tint + subtle glow), not general text
- Focus/active micro-glow (paired with ghost border fallback) on the primary action only

Ghost border fallback (accessibility only): `outline-variant` at ~15% opacity (no hard strokes).

---

## Copywriting Contract

Phase 4 adds payment entry + return states. Copy must stay short, confident, and action-oriented.

| Element | Copy |
|---------|------|
| Primary CTA | **Pay now** |
| Empty state heading | **Booking not found** |
| Empty state body | **This payment link is invalid or expired. Go back to your booking and try again.** |
| Error state | **Couldn’t start checkout. Check your connection and try again.** |
| Destructive confirmation | none (no destructive actions in Phase 4 UX) |

Additional locked microcopy (return UX):
- Success return optimistic state title: **Payment received**
- Success return pending body: **Confirming your booking…**
- Pending fallback guidance: **If this takes longer than a moment, you can leave and check later in My bookings.**
- Cancel return toast/inline: **Payment cancelled**
- Cancel return helper: **Your booking is still reserved. Try again before it expires.**
- Retry CTA label: **Try again**
- Success screen headline: **Booking confirmed**
- Success screen primary CTA: **Go to My bookings**
- Success screen secondary CTA (optional): **Add to calendar**

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| Ionic | ion-button, ion-header/toolbar, ion-content, ion-card, ion-chip, ion-spinner, ion-skeleton-text | not applicable |

---

## Screen Contracts (Phase 4 additions)

### Screen D — Booking reserved (awaiting payment) with payment entry

**Where:** extend the existing “Booking reserved / Awaiting payment” status screen from Phase 3.

**Focal point & hierarchy:**
- Primary: status chip + booking summary card (anchors “what this is”)
- Secondary: **Pay now** gradient CTA (anchors “what to do next”)

**Layout contract (keep Phase 3 look/feel):**
- Same hero/title stack + summary card style as the Phase 3 status screen
- Status chip stays **Awaiting payment**
- New action area appears below summary card:
  - Primary CTA: **Pay now** (gradient)
  - Secondary action: **Change time** (ghost border / tonal button) → returns to date/time selection

**Behavior:**
- On tap **Pay now**:
  - optimistic pressed feedback immediately
  - CTA transitions to loading state (disable double-taps; label can become “Opening checkout…”)
  - app performs an API call to create/reuse Stripe Checkout session for this booking
  - on success: open Stripe Checkout via external redirect (system browser / in-app browser per existing app pattern)

**Error states (inline, tonal, no borders):**
- network/server error starting checkout:
  - show inline alert above CTA using tonal layering
  - keep **Try again** available

### Screen E — Payment return: success pending / success confirmed / cancelled

**Entry:** user returns to app from Stripe Checkout success/cancel URLs.

**Focal point & hierarchy:**
- Primary: **Payment received** headline + confirming card (spinner + short copy)
- Secondary: guidance line + escape hatch CTA (“Go to My bookings” / “Back to booking”)

**Success (race-safe) contract:**
- If booking is already confirmed when the screen loads:
  - route directly to Screen F (Success)
- If booking is not yet confirmed:
  - show a dedicated state:
    - Title: **Payment received**
    - Body: **Confirming your booking…**
    - Primary affordance: a subtle spinner + tonal loading card (no busy full-screen animation)
  - Poll booking status briefly:
    - cadence: ~1s–2s backoff, hard stop within ~10s–15s
  - If confirmed during polling: transition to Screen F
  - If still not confirmed after polling:
    - keep UI calm; show guidance text: “If this takes longer than a moment…”
    - provide CTA: **Go to My bookings** (or “Back to booking” if Phase 5 isn’t built yet)

**Cancel return contract:**
- Route back to the reserved booking status (Screen D)
- Show “Payment cancelled” as a toast or inline tonal alert at top of the content
- Keep booking status as **Awaiting payment** and CTA **Try again**

### Screen F — Booking success (confirmed)

**Visual direction:** align to `src/design/booking_success/code.html` but implemented with Ionic primitives.

**Focal point:**
- A large editorial headline (Display) **Booking confirmed**
- A single high-impact icon (e.g., trophy/check) in an elevated glass panel with subtle accent glow

**Content:**
- Confirmation badge/chip (gold secondary accent allowed)
- Booking detail bento (2 cards on wide, stacked on mobile): date/time + location/modality (match the design HTML composition without Tailwind)
- Primary CTA: **Go to My bookings**
- Optional secondary CTA: **Add to calendar** (secondary tonal button)

**Motion:**
- subtle opacity/scale transitions (150–200ms)
- avoid heavy parallax; keep transactional screen calm and premium

---

## State UX (Loading / Empty / Error)

### Loading
- Use `ion-skeleton-text` for booking summary while fetching booking status (return/poll)
- Use `ion-spinner` only in the confirming state (Screen E), not on every transition

### Empty (invalid booking return / missing booking)
- Heading: **Booking not found**
- Body: **This payment link is invalid or expired. Go back to your booking and try again.**
- Action: **Back to booking** (or “Explore” if no booking route available)

### Error
- Stripe return without network:
  - show: “Couldn’t confirm right now. We’ll keep trying when you’re back online.”
  - CTA: “Go to My bookings” (or “Back to booking”)

---

## Implementation Checklist (for the executor)

- [ ] Extend the existing awaiting-payment booking status screen to include **Pay now** and retry UX.
- [ ] Add a dedicated return screen/state that handles:
  - success-but-not-confirmed-yet (polling)
  - success-confirmed (route to success)
  - cancel (back to reserved booking with retry CTA)
- [ ] Implement Success screen aligned to `src/design/booking_success/code.html` using Ionic components, consistent tokens, and “no-line rule”.
- [ ] Ensure all tappables meet ≥44px height, and selected/success states are perceivable without color alone (label + icon).

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS (no third-party registries)

**Approval:** approved 2026-04-24

