---
phase: 3
slug: 03-slots-booking-pre-payment
status: draft
stack: ionic-angular
created: 2026-04-24
---

# Phase 3 — UI Design Contract (Slots & booking — pre-payment)

This document is the **visual + interaction contract** for Phase 3 booking flow screens in the Ionic/Angular app.

**Hard constraints (must follow):**
- **Ionic/Angular components and styling only** (no Tailwind).
- **DESIGN.md “No-Line Rule”**: no 1px solid borders for sectioning/containment; use **tonal layering**, gradients, and glass blur instead.
- **Availability UX is locked**:
  - **Calendar month view → pick a day → pick a time** aligned to `src/design/select_date_time/code.html` (D-01).
  - Browse **next 30 days** only (D-02).
  - For a chosen day, show times grouped into **time-of-day buckets** (Morning / Evening; Afternoon optional) (D-03).
- **Timezone policy is locked**:
  - Treat schedule + display as **America/Los_Angeles**; UI does not need a timezone label in v1 (D-04).
  - Server stores UTC; UI simply reflects the policy (CAL-03, D-05).
- **Booking creation contract is locked**:
  - Booking creation requires auth; if unauthenticated, redirect to `/login` then return to booking flow with selection preserved (D-06).
  - Availability returns a server-issued `slotId`; create-booking accepts `slotId` (D-07).
  - Booking is created in **awaiting payment** (or equivalent) and reserves slot for a short TTL (target 10–15 minutes) (D-08).
  - Stale/unavailable slot at create time: **friendly error + refresh day** (no kicking back to month view) (D-09).
- Auth/session stays cookie-based; all API calls use `withCredentials: true` and existing refresh-on-401 behavior (D-10).

---

## Scope (what ships in Phase 3)

From `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/03-slots-booking-pre-payment/03-CONTEXT.md`:

- **Slot selection**: month calendar → day selection → time grid grouped by day buckets (CAL-01, CAL-02).
- **Pre-payment booking review**: a summary screen aligned to `src/design/booking_summary/code.html` (but **without payment UI** in Phase 3).
- **Create booking**: reserves slot and shows a created booking in **awaiting payment** status (BKG-01, BKG-03).
- **Edge cases**: no availability, stale selection, friendly errors (03-04).

Out of scope: payments UI, payment method selection, webhooks, confirmed booking success screen (Phase 4+), “My bookings” history (Phase 5), admin schedule UI (Phase 6).

---

## Design System (Ionic adaptation of “Kinetic Gallery”)

Reuse Phase 2 foundations and tokens (do not fork a new visual language):

- **Fonts**: already globally loaded in `src/index.html`
  - Display/Headlines: **Inter**
  - Body/Labels: **Manrope**
- **Iconography**: use **Ionic `ion-icon` (Ionicons)** only.
- **Surfaces & depth**: follow `DESIGN.md` surface hierarchy via tonal steps; no strokes.
- **Glass & gradient**:
  - Toolbars / sticky headers: `backdrop-filter: blur(24px)` + subtle gradient to transparent.
  - Primary CTAs: **135° gradient** from `primary` (`#ffb4a8`) → `primary-container` (`#ff5540`) with a warm glow shadow.

### Tokens (carry forward Phase 2 baseline)

#### Spacing scale (multiples of 4 only)
Use these “named” spacings consistently:

| Token | Value | Usage |
|------:|------:|-------|
| xs | 4px | icon gaps, tight inline padding |
| sm | 8px | compact element spacing |
| md | 16px | default padding and gaps |
| lg | 24px | section padding, card padding |
| xl | 32px | major section breaks |
| 2xl | 48px | hero/editorial breathing room |

**Touch targets**: minimum 44px height for tappables (rows, buttons, time chips).

#### Typography (exact roles)
Use these roles (do not invent new ones):

| Role | Font | Size | Weight | Line height | Usage |
|------|------|------|--------|-------------|-------|
| Display | Inter | 40–56px (responsive clamp) | 900 | 1.0–1.1 | big page headline (“Review booking”) |
| Heading | Inter | 24px | 800 | 1.15 | section headers (“Morning sessions”) |
| Body | Manrope | 16px | 400 | 1.5 | explanatory copy, summaries |
| Label | Manrope | 12px | 700 | 1.2 | kickers, meta labels, helper text |

**Letter-spacing**:
- Display/Heading: -0.02em to -0.04em
- Label: +0.20em to +0.30em, uppercase

#### Color palette (use DESIGN.md values)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#131313` | app background, main canvas |
| Secondary surfaces (30%) | `#0e0e0e`, `#1b1b1b`, `#1f1f1f`, `#2a2a2a`, `#353535` | cards/sheets/elevations |
| Accent (10%) | `#ff5540` and `#ffb4a8` | reserved list below |
| Gold (secondary accent) | `#e9c349` | premium/elite cues, kicker text |
| Destructive | Ionic `danger` color | errors/destructive only |

**Accent reserved for (explicit):**
- Primary CTA backgrounds (gradient)
- Selected time slot state + “selected” pill
- Key headline emphasis + subtle glow accents

**No-line rule enforcement:**
- Do not add `border: 1px solid ...` for separation.
- If an accessibility boundary is truly needed, use a “ghost border” only on focus/active:
  - `rgba(96, 62, 57, 0.15)` (`outline-variant` at ~15% opacity)

---

## Navigation & Routes (Phase 3 contract)

Phase 2 created `/book?fighterId=...&serviceId=...` as a placeholder. Phase 3 replaces that route with the real booking flow.

### Entry route (must remain stable)
- **Route**: `/book`
- **Query params (required)**:
  - `fighterId`
  - `serviceId`
- **Deep link requirement**: visiting `/book?fighterId=...&serviceId=...` must work on refresh.

### Internal flow (can be separate routes or one page with steps)

Either implementation is acceptable as long as state and back-navigation match:

- **Step 1: Select date & time**
  - Month calendar + day selection
  - Time bucket grid for selected day
  - Requires availability API call scoped to fighterId/serviceId and date range (next 30 days)
- **Step 2: Review & reserve (create booking)**
  - Summary card and details aligned to `src/design/booking_summary/code.html`
  - Primary CTA creates booking (server hold) and navigates to status screen
- **Step 3: Booking created (awaiting payment)**
  - Shows booking status as **Awaiting payment**
  - Explains that payment happens next phase; provide a safe next action (e.g. “Back to profile”)

### Auth redirect contract (D-06)

- If user is unauthenticated when trying to create a booking (or when entering the flow if guarded):
  - route to `/login`
  - after success, return to `/book?fighterId=...&serviceId=...` with any in-progress selection preserved (selected date + slotId if still valid; otherwise date only).

**Back navigation (hardware/software)**
- From Review → returns to Select date/time keeping chosen day selected.
- From Select date/time → returns to Fighter profile (`/fighters/:fighterId`).

---

## Screen Contracts

### Screen A — Select date & time

**Visual direction**: match `src/design/select_date_time/code.html` (calendar header + month grid + bucketed time grid + bottom CTA).

**Layout**
- `ion-header` + translucent `ion-toolbar` with blur and top-to-bottom gradient fade.
- Editorial title block:
  - kicker (Label, gold): “Schedule session”
  - headline (Display/Heading, Inter): current month/year in uppercase
- Calendar card:
  - tonal “well” background (`surface-container-lowest`) with rounded corners
  - day-of-week labels as tiny uppercase labels
  - day cells are tap targets (≥44px) with hover/pressed feedback
  - selected day has **primary-container** fill and subtle glow shadow
- Time buckets:
  - section headers (Heading) with a small icon
  - 2-column grid on phone, 4-column on wide
  - each slot is a button-like tonal tile

**Time slot states**
- **Available**: tonal tile, label “Available”
- **Selected**: primary-container tile, label “Selected”
- **Unavailable/fully booked**: darker well tone + reduced opacity, disabled
- Optional scarcity copy: “Only 1 slot left” (use secondary/gold, not destructive)

**Behavior**
- Default: show month view with the first available day preselected if returned by API; otherwise no selection until user taps.
- Date range: restrict navigation to today…today+30 days (D-02).
- Selecting a day triggers fetch for that day’s slots (or uses prefetched map); keep interaction snappy with skeletons.
- Selecting a time sets `slotId` and enables the footer CTA.

**Footer CTA**
- Primary CTA (gradient): **“Confirm date & time”**
- Disabled until a time is selected.
- Secondary helper text below CTA (Label): “48-hour cancellation policy applies” (copy can be refined, but keep short).

---

### Screen B — Review & reserve (pre-payment)

**Visual direction**: align to `src/design/booking_summary/code.html` for the hero/title and booking summary card, but Phase 3 must not show payment method selection.

**Layout**
- Editorial title:
  - kicker: “Review”
  - headline (Display): “Booking”
- Summary card:
  - glass/tonal card (blurred translucent surface)
  - fighter image (high-contrast, grayscale allowed)
  - fighter name + selected service name
  - date + time row with icons
  - include service modality and duration (and optionally derived end time)
- Booking status preview:
  - small label row: “Status after reserving: Awaiting payment”

**Primary CTA**
- Label: **“Reserve slot”**
- On tap:
  - show immediate pressed feedback
  - switch CTA to loading state (spinner + “Reserving…”)
  - call create-booking API with `slotId`

**Error handling (must be friendly)**
- If server returns stale/unavailable for chosen `slotId` (D-09):
  - show a tonal alert block (no borders) inline above CTA:
    - Heading: “That time just got taken.”
    - Body: “Pick another time — we refreshed today’s availability.”
    - Action: “View updated times”
  - On action: return user to Screen A with the same day selected and refreshed slots.

---

### Screen C — Booking created (awaiting payment)

Purpose: immediately satisfies BKG-03 by showing the created booking with status.

**Layout**
- Title: “Booking reserved”
- Status chip: **“Awaiting payment”** (accent highlight)
- Summary block (tonal card): fighter, service, date/time
- Body copy (Body):
  - “We’re holding this time for a short window. Payment will be available next.”
  - (Do not mention exact TTL unless product wants it; keep it vague but honest.)

**Primary action**
- In Phase 3, do not show “Pay now” as an active path. Use one of:
  - “Back to profile”
  - “Explore fighters”

**Secondary action**
- “Change time” → returns to Screen A (same fighter/service).

---

## State UX (Loading / Empty / Error) — mandatory

### Loading
- Use Ionic skeletons (`ion-skeleton-text`) that preserve layout rhythm:
  - calendar grid skeleton tiles
  - slot tile skeletons
  - summary card skeleton rows
- Avoid jumpy reflow when slots load.

### Empty (no slots)
- For a day with zero slots:
  - Heading: “No times available”
  - Body: “Try another day — new sessions open up regularly.”
  - Action: “Pick a different date”
- For entire 30-day horizon with no availability:
  - Heading: “No availability in the next 30 days”
  - Body: “Check back soon or choose another fighter.”
  - Actions: “Back to profile”, “Explore”

### Error (network/server)
- Use a tonal alert block (no borders) with:
  - short statement (“Couldn’t load availability.”)
  - action (“Retry”)
- Auth edge:
  - Availability browsing can be allowed without auth; do not auto-redirect to login on availability errors.
  - Booking creation must enforce auth: if 401 at reserve time, redirect to login per D-06.

---

## Copywriting Contract (Phase 3)

| Element | Copy |
|---------|------|
| Select screen kicker | “Schedule session” |
| Select screen primary CTA | “Confirm date & time” |
| Slot available microcopy | “Available” |
| Slot selected microcopy | “Selected” |
| Slot unavailable microcopy | “Fully booked” |
| Review screen kicker | “Review” |
| Review screen headline | “Booking” |
| Reserve primary CTA | “Reserve slot” |
| Reserve loading | “Reserving…” |
| Stale slot heading | “That time just got taken.” |
| Stale slot body | “Pick another time — we refreshed today’s availability.” |
| Booking created title | “Booking reserved” |
| Booking status chip | “Awaiting payment” |
| Empty day heading | “No times available” |
| Empty horizon heading | “No availability in the next 30 days” |
| Generic availability error | “Couldn’t load availability. Check your connection and try again.” |

---

## Accessibility & Motion

- All tappable controls meet **44px** minimum height.
- Selected slot state must be perceivable without color alone:
  - include a “Selected” label and/or check icon
- Focus states use “ghost border” + subtle glow, not hard strokes.
- Motion:
  - subtle opacity/scale transitions (150–200ms)
  - avoid heavy parallax or long animations in time selection

---

## Implementation Checklist (for the executor)

- [ ] Replace Phase 2 `/book` placeholder with Phase 3 flow, keeping query params `fighterId` + `serviceId`.
- [ ] Build Select date/time UI aligned to `src/design/select_date_time/code.html` (month + day + bucketed time grid).
- [ ] Enforce 30-day browse horizon in the UI and API calls.
- [ ] Implement slot tile states: available/selected/unavailable.
- [ ] Implement Review & reserve screen aligned to `src/design/booking_summary/code.html` (without payment section).
- [ ] Create-booking uses server-issued `slotId`; handle stale slot with friendly error + refresh day (stay in picker context).
- [ ] After booking creation, show Booking created screen with **Awaiting payment** status.
- [ ] Auth redirect: unauthenticated reserve routes to `/login`, then returns to booking flow with selection preserved.
- [ ] Add consistent loading/empty/error states using skeletons and tonal alerts (no borders).

---

## Checker Sign-Off (manual until ui-checker is available)

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PASS (no registries introduced; Ionic-only)

**Approval:** pending

---

## UI-SPEC COMPLETE
