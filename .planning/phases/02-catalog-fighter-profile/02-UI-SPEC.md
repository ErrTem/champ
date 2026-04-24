---
phase: 2
slug: 02-catalog-fighter-profile
status: draft
stack: ionic-angular
created: 2026-04-24
---

# Phase 2 — UI Design Contract (Catalog & Fighter Profile)

This document is the **visual + interaction contract** for Phase 2 screens in the Ionic/Angular app.

**Hard constraints (must follow):**
- **Ionic/Angular components and styling only** (no Tailwind).
- **DESIGN.md “No-Line Rule”**: no 1px solid borders for sectioning/containment; use **tonal layering**, gradients, and glass blur instead.
- Must include consistent **loading / empty / error** states (see “State UX”).
- Must implement **D-04 service selection** behavior:
  - Selecting a service selects **exactly one** and **immediately navigates** to next step (Phase 2 placeholder route).
  - A footer CTA exists but is **disabled or hidden until selection**; after selection it becomes available (primarily for accessibility / clear primary action).
- Must include route/UX contract for placeholder **“Book”** entry that carries **fighterId + serviceId**.

---

## Scope (what ships in Phase 2)

From `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/phases/02-catalog-fighter-profile/02-CONTEXT.md`:
- **Explore (Catalog)**: list all **published fighters** from API with image, name, short summary, and **“From $X”** (min service price). Static discipline chips UI (no filtering behavior yet).
- **Fighter profile**: hero + bio + **required stats** + structured services list (duration, modality, price).
- **Book placeholder**: selecting a service advances to placeholder “Book” entry until Phase 3 implements slots.

Out of scope: real availability UI, booking creation, payments, bookmark/saved fighters, working filters.

---

## Design System (Ionic adaptation of “Kinetic Gallery”)

### Foundations
- **Fonts**: already globally loaded in `src/index.html`
  - Display/Headlines: **Inter**
  - Body/Labels: **Manrope**
- **Iconography**: use **Ionic `ion-icon` (Ionicons)** only for Phase 2 (no new icon webfonts).
- **Surfaces & depth**: follow `DESIGN.md` surface hierarchy via **background tonal steps** (no strokes).
- **Glass & gradient**:
  - Use translucent toolbars / sticky filter areas with `backdrop-filter: blur(24px)` and a subtle top-to-bottom gradient.
  - Primary CTAs use a **135° gradient** (see Tokens section).

### App-wide token approach
Phase 1 already established a pattern in `src/app/pages/shared-auth.scss` using CSS variables (e.g. `--auth-bg`, `--auth-surface`, `--auth-secondary`, `--auth-muted`).

**Phase 2 pages must follow the same pattern**:
- Define page-level tokens under `:host` for the page component stylesheet.
- Use Ionic component CSS variables (e.g. `ion-toolbar { --background: ...; --color: ... }`) rather than borders.

---

## Tokens (Phase 2 baseline)

### Spacing scale (multiples of 4 only)
Use these “named” spacings consistently:

| Token | Value | Usage |
|------:|------:|-------|
| xs | 4px | icon gaps, chip inner padding fine-tune |
| sm | 8px | tight gaps inside list items |
| md | 16px | default padding and gaps |
| lg | 24px | section padding, card padding |
| xl | 32px | major section breaks |
| 2xl | 48px | hero spacing, large editorial breathing room |

**Touch targets**: minimum 44px height for tappables (rows, chips, buttons).

### Typography (exact roles)
Use these roles (do not invent new ones):

| Role | Font | Size | Weight | Line height | Usage |
|------|------|------|--------|-------------|-------|
| Display | Inter | 40–56px (responsive clamp) | 900 | 1.0–1.1 | hero name/headline |
| Heading | Inter | 24px | 800 | 1.15 | section headers (“Services”) |
| Body | Manrope | 16px | 400 | 1.5 | paragraphs/bio, summaries |
| Label | Manrope | 12px | 700 | 1.2 | kickers, chip text, meta labels |

**Letter-spacing**:
- Display/Heading: -0.02em to -0.04em (tight, editorial)
- Label: +0.20em to +0.30em, uppercase

### Color palette (use DESIGN.md values)
Use these values (copied from the design references / DESIGN.md):

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#131313` | app background, main canvas |
| Secondary surfaces (30%) | `#1b1b1b`, `#1f1f1f`, `#2a2a2a`, `#353535` | cards, sheets, elevated containers |
| Accent (10%) | `#ff5540` and `#ffb4a8` | reserved list below |
| Gold (secondary accent) | `#e9c349` | premium/elite cues, kicker text |
| Destructive | Ionic `danger` color | error banners, destructive actions only |

**Accent reserved for (explicit):**
- Primary CTAs (button background gradient)
- Active/selected state highlight (selected service row moment)
- Key headline emphasis (e.g. name highlight span)
- Progression/forward action cues (“Book now” label)

**No-line rule enforcement:**
- Do not add `border: 1px solid ...` for separation.
- If an accessibility boundary is truly needed, use a “ghost border”:
  - `rgba(96, 62, 57, 0.15)` (outline-variant at ~15% opacity) and only on focus/active states.

---

## Navigation & Routes (Phase 2 contract)

### New public routes (must be accessible without auth)
Add three routes to `src/app/app.routes.ts` (exact naming can vary, but params must match this contract):

1. **Explore (Catalog)**
   - **Route**: `/explore`
   - **Purpose**: fighter catalog list (CAT-01..03)

2. **Fighter profile**
   - **Route**: `/fighters/:fighterId`
   - **Purpose**: bio, stats, services for fighter (FTR-01..02)

3. **Book placeholder (Phase 2 entrypoint to Phase 3 flow)**
   - **Route**: `/book`
   - **Query params (required)**:
     - `fighterId` (string/uuid)
     - `serviceId` (string/uuid)
   - **Purpose**: placeholder screen confirming selection and messaging “Scheduling in Phase 3”.

**Deep link requirement:**
- Visiting `/book?fighterId=...&serviceId=...` must render deterministically (even on refresh).

### Cross-route behavior
- From **Explore**, tapping a fighter card navigates to `/fighters/:fighterId`.
- From **Fighter profile**, selecting a service navigates immediately to `/book?fighterId=...&serviceId=...` (D-04).
- The hardware/software back action must return:
  - book → fighter profile
  - fighter profile → explore

---

## Screen Contracts

### Screen A — Explore (Catalog)

**Layout**
- `ion-header` + translucent `ion-toolbar` (glass blur).
- `ion-content` scroll container.
- Top hero section (editorial):
  - small kicker label (Label role, gold)
  - large headline (Display role, Inter)
  - short subcopy (Body role)
- Sticky filter bar section below hero:
  - horizontally scrollable **discipline chips** (static only; D-02)
  - a “Refine” / “Price range” control can be static UI (no behavior required), styled as **pills** with tonal background (no borders)
- Fighter list:
  - Prefer a **single-column** list on phone; allow 2-col on wide viewports.
  - Cards are “tonal” (secondary surface) with an image block + gradient overlay to the bottom.
  - Each card shows:
    - fighter name (Heading role, Inter, uppercase/italic allowed)
    - short summary (Body role, 1–2 lines max)
    - **price** shown as **“From $X”** (D-01) where \(X\) is min service price for that fighter.

**Card interaction**
- Entire card is tappable (minimum 44px touch).
- On press: brief active feedback via opacity/scale \(0.98\) and accent glow shadow; no borders.

**Data requirements displayed**
- `name`
- `photoUrl` (or placeholder image behavior)
- `summary` (short bio/tagline)
- `fromPrice` (computed min service price)

**Empty/edge cases**
- If fighter has **no photo**: show a neutral dark placeholder with initials monogram (Inter, weight 800).
- If fighter has **no services** (should not happen for published fighters, but handle): show “From —” and prevent navigation to book later.

---

### Screen B — Fighter Profile

**Layout**
- Hero section with fighter image:
  - image is full-bleed at top with a bottom gradient fade into background (no borders).
  - overlay:
    - optional tier badge (gold chip)
    - fighter name (Display role)
    - short subtitle line (Label/Body mixed; e.g. “Former UFC …”)
- Stats grid (required; D-05):
  - 2–4 tiles in a bento-ish grid using tonal steps (e.g. low vs high surfaces).
  - Each tile has:
    - small label (Label role)
    - big value (Inter, 32–40px)
- Bio section:
  - header kicker (Label role, accent or gold)
  - paragraph body (Body role, 16px, 1.5)
- Services section:
  - section title “Services” (Heading role)
  - list of service rows (see below)

**Service rows (selectable list)**
Each row must display (FTR-02):
- service name/title
- duration (e.g. “60 min”)
- modality (e.g. “Online” / “In person”)
- price (e.g. “$150”)

**Row styling**
- Use a tonal background block and generous spacing; no dividers.
- Optional leading icon block (ion-icon) inside a small tonal square.
- Secondary metadata uses muted color (from auth pattern: `--auth-muted`-like).

**D-04 selection + navigation contract**
- Tapping a service row:
  - **visually acknowledges selection** (brief accent highlight / glow and/or checkmark)
  - sets internal selection state
  - **immediately navigates** to the Book placeholder route with `fighterId` + `serviceId`

**Footer CTA (accessibility-first)**
- A primary CTA exists at the bottom of the screen:
  - Label: **“Book session”**
  - Default state: **hidden OR disabled** until a service is selected
  - After a service is selected: enabled and triggers the same navigation as row-tap
- Implementation note: because navigation is immediate on row-tap, the CTA primarily serves:
  - screen reader users (clear primary action)
  - users who prefer confirmation

**Back navigation**
- Provide a clear back affordance in the toolbar (Ion back button) to return to Explore.

---

### Screen C — Book Placeholder (Phase 2)

**Purpose**
This is **not** the scheduling UI. It is a placeholder entry point proving the Phase 2 flow (ROADMAP Phase 2 success criteria #3).

**Route**
- `/book?fighterId=...&serviceId=...` (required)

**Content**
- Heading (Inter): “Book”
- Summary card showing:
  - fighter name (loaded via fighterId)
  - service title + duration + modality + price (loaded via serviceId)
- Informational message (Body):
  - “Scheduling will be available in the next phase. You’ve selected this service successfully.”
- Primary CTA (gradient):
  - “Choose a time” (disabled) OR “Coming soon” (enabled but only navigates back)
  - Must not imply booking is created in Phase 2.
- Secondary action:
  - “Back to profile” (navigates to `/fighters/:fighterId`)

**State behavior**
- If query params missing/invalid:
  - show error state and provide “Back to Explore” action.

---

## State UX (Loading / Empty / Error) — mandatory

These must align with `DESIGN.md` and avoid borders/dividers.

### Loading
- Use Ionic skeletons:
  - `ion-skeleton-text` blocks for hero lines and card rows
  - image placeholders are rectangular skeletons with rounded corners
- Loading must preserve layout rhythm (avoid jumpy reflow).

### Empty (no fighters / no services)
- Show a centered editorial empty state card using tonal surface:
  - **Heading**: “No fighters yet”
  - **Body**: “Check back soon — we’re curating the next roster.”
  - Optional secondary action: “Refresh”
- For services empty (profile):
  - Heading: “No services available”
  - Body: “This fighter isn’t bookable yet.”

### Error
- Errors are shown as a **tonal alert block** (not a bordered box):
  - background: darker surface tier
  - left accent strip can be a gradient glow/shadow (avoid 1px border)
  - include:
    - short problem statement: “Couldn’t load fighters.”
    - action: “Retry”
- Network/auth edge:
  - Explore/Profile are public; do not redirect to login on 401 from public endpoints—show the error block and allow retry.

---

## Copywriting Contract (Phase 2)

| Element | Copy |
|---------|------|
| Explore hero kicker | “PRO TRAINING” |
| Explore hero headline | “ELITE STRIKERS” (or “Explore fighters”) |
| Catalog empty heading | “No fighters yet” |
| Catalog empty body | “Check back soon — we’re curating the next roster.” |
| Catalog error | “Couldn’t load fighters. Check your connection and try again.” |
| Profile services title | “Services” |
| Profile primary CTA | “Book session” |
| Book placeholder heading | “Book” |
| Book placeholder info | “Scheduling will be available in the next phase. You’ve selected this service successfully.” |
| Book placeholder primary CTA | “Choose a time” (disabled) / “Coming soon” |
| Book placeholder secondary | “Back to profile” |

---

## Accessibility & Motion

- All tappable controls meet **44px** minimum height.
- Ensure sufficient contrast on text against surfaces (use muted text only for secondary metadata).
- Service selection must provide:
  - visible pressed/selected feedback
  - screen reader announcement (selected + navigating)
- Motion:
  - keep transitions subtle (opacity/scale, 150–200ms)
  - avoid large parallax effects

---

## Implementation Checklist (for the executor)

- [ ] Add routes `/explore`, `/fighters/:fighterId`, and `/book` (query params fighterId + serviceId).
- [ ] Implement Explore UI: hero + sticky chips + fighter cards; compute “From $X”.
- [ ] Implement Fighter profile UI: hero + **required stats** + bio + services list.
- [ ] Implement D-04: service row tap selects one and navigates immediately; footer CTA hidden/disabled until selection and triggers same navigation.
- [ ] Implement Book placeholder: reads query params, loads fighter+service summary, shows “coming soon” messaging.
- [ ] Implement consistent loading/empty/error UI with skeletons and tonal alert blocks (no borders).

---

## UI-SPEC COMPLETE
