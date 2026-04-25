---
phase: "06"
slug: admin
status: draft
tool: "ionic-angular"
created: "2026-04-25"
---

# Phase 06 — UI Design Contract

> Visual and interaction contract for admin (staff-only) frontend work in Phase 06.

---

## Design System

- UI stack: Ionic (`@ionic/angular`) + SCSS
- Fonts: Inter (headlines) + Manrope (body/labels)
- Follow `DESIGN.md` **No-Line Rule** (no 1px dividers for structure; use tonal layering + spacing)

Sources:
- `.planning/phases/06-admin/06-CONTEXT.md`
- `DESIGN.md`
- Prior UI contract patterns: `.planning/phases/05-my-bookings-notifications/05-UI-SPEC.md`

---

## Spacing Scale

Use only multiples of 4px; prefer same tokens as Phase 05:

- xs 4px
- sm 8px
- md 16px
- lg 24px
- xl 32px
- 2xl 48px

Rule: no new off-scale spacing introduced in Phase 06 pages/components.

---

## Typography

Match Phase 05 baseline unless existing app pages already define stronger conventions:

- Body: 16px / 400 / lh 1.5
- Label: 12px / 900 / lh 1.3
- Heading: 20px / 900 / lh 1.2
- Display: 28px / 900 / lh 1.05

---

## Color / Surfaces

- Base canvas: `#131313`
- Containers: `#1f1f1f` (cards, grouped lists)
- Elevated inputs: `surface-container-highest` feel using darker-to-lighter tonal stacking (no hard borders)
- Primary CTA: existing `.kinetic-gradient` (accent `#ff5540` with gradient start `#ffb4a8`)
- Ghost border fallback: `outline-variant` at ~15% opacity only when needed for accessibility

---

## Navigation + Access Contract (ADM-01)

- Entry: Profile page shows **Admin** link only if user is admin (still guard routes).
- Routes: under `/admin` (exact child paths flexible), separated from customer routes.
- Admin shell: tabs with 4 sections (D-06):
  - Fighters
  - Services
  - Schedule
  - Bookings (read-only)

Loading pattern: avoid blank spinner pages; prefer skeleton rows/cards.

---

## Copywriting Contract

Tone: short, operational, non-marketing.

Preferred labels:
- Buttons: `Save`, `Create`, `Update`, `Deactivate`, `Reactivate`, `Retry`
- Section titles: `Fighters`, `Services`, `Schedule`, `Bookings`
- Empty state headline: `Nothing here yet`
- Error: `Couldn’t load data. Check connection and try again.`

---

## Screen Contracts

### Admin tabs shell

- **Header**: `Admin`
- **Tabs**: 4 icons + labels, consistent across device sizes
- **Guard**:
  - If not admin: redirect to Profile (or Home) and show toast `Admin access required`

### Fighters (ADM-02)

- **List**:
  - Search optional (nice-to-have); if skipped, keep list sortable (name A→Z)
  - Rows show: name, active state chip, small secondary line (discipline or short bio excerpt if available)
  - Actions per row: `Edit`
  - Page actions: `Create fighter`
- **Edit/Create form**:
  - Fields: name (required), bio (optional), image URL (optional), active toggle
  - Save uses primary CTA style (`.kinetic-gradient`)
  - Validation errors inline; no modal required

### Services/prices (ADM-03)

- Scope: services attached to selected fighter.
- **Fighter selector**: required first step (top select or drill-in from Fighters).
- **Service list**:
  - Rows show: title, duration, modality, price, active state
  - Actions: `Edit`, plus `Create service`
- **Edit/Create form**:
  - Fields: title, duration (minutes), modality (online/offline), price (currency display), active toggle
  - Price editing: numeric input with currency label (no complex formatting required)

### Schedule (ADM-04)

- Scope: weekly schedule rules (`FighterScheduleRule`) for selected fighter.
- **Timezone**: display and input in `America/Los_Angeles` (D-10). Show small label `Times shown in PT`.
- **Editor**:
  - 7-day list
  - Each day: 0..N windows (start/end)
  - Add/remove window buttons (secondary styling; no destructive red)
  - Save triggers backend regeneration horizon policy (rolling 30 days, D-08)
- **Safety messaging**:
  - Show helper text: `Confirmed bookings never modified` (D-09)

### Bookings (ADM-05)

- **List**:
  - Filters required (D-12):
    - Status
    - Date range (slot start time)
    - Fighter
  - Results show: fighter name, user (minimal identifier), local time, status chip
  - Tap row → detail
- **Detail (read-only)**:
  - Show: fighter, service, slot time (PT display ok; no timezone label required), user name/email (if available), booking status, payment status, price
  - No actions in v1 (D-13)

---

## Checker Sign-Off (manual)

- [ ] Copywriting coherent
- [ ] No-Line Rule respected
- [ ] Uses declared spacing scale
- [ ] Admin guard behavior defined

