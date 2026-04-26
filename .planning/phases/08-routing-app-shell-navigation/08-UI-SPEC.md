---
phase: 8
slug: 08-routing-app-shell-navigation
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-26
---

# Phase 8 — UI Design Contract (Routing + app shell navigation)

> Exact UI/IA contract for default route `/explore`, shared header/back pattern, bottom tab bar (Explore/Bookings/Profile/Admin gating), deep link + back behavior.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Ionic components) |
| Preset | not applicable |
| Component library | Ionic 8 (`@ionic/angular`) |
| Icon library | Ionicons |
| Font | system default (platform) |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact spacing |
| md | 16px | Default page padding |
| lg | 24px | Section padding |
| xl | 32px | Major gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: none

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.3 |
| Heading | 20px | 600 | 1.2 |
| Display | 28px | 600 | 1.1 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | app default | Primary backgrounds/surfaces (Ionic theme) |
| Secondary (30%) | app default | Cards, toolbars, tab bar |
| Accent (10%) | app default | Primary CTA buttons only (e.g. “Book session”), selected tab indicator |
| Destructive | app default | Destructive actions only |

Accent reserved for:
- primary CTAs (single main action per screen)
- selected tab underline/indicator (if shown)

---

## Copywriting Contract

This phase touches navigation chrome; keep copy minimal and consistent.

| Element | Copy |
|---------|------|
| Primary CTA | not applicable |
| Empty state heading | not applicable |
| Empty state body | not applicable |
| Error state | not applicable |
| Destructive confirmation | not applicable |

---

## Information Architecture (IA)

### Navigation model

- **Primary navigation**: persistent bottom tab bar for **Explore / Bookings / Profile / Admin**.
- **Secondary navigation**: in-page links (e.g. fighter card → fighter details) must stay within current tab context.
- **Back**: explicit top-left back arrow on all primary pages; uses Ionic stack when present, else deterministic fallback to `/explore`.

### Route groups

**Public (no tab bar required):**
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

**App shell (tabs; tab bar visible):**
- Explore tab routes
- Bookings tab routes (auth gated)
- Profile tab routes (auth gated)
- Admin tab routes (admin gated)

### Canonical route map (contract)

#### Defaults + redirects (locked)
- **`/` → `/explore`**
- **`**` (unknown URL) → `/explore`**
- **Home route removed/disabled** (no `/home` entrypoint)

#### Explore (tab id: `explore`)
- **`/explore`**: explore catalog (current `CatalogPage`)
- **`/explore/fighters/:fighterId`**: fighter profile/details
- **Legacy alias**: `/fighters/:fighterId` must redirect to `/explore/fighters/:fighterId` (deep links keep Explore selected)

#### Bookings (tab id: `bookings`) — requires auth
- **`/bookings`**: my bookings list (replace/alias current `/my-bookings`)
- **`/bookings/:bookingId`**: booking detail
- **Legacy alias**: `/my-bookings` must redirect to `/bookings`
- **Legacy alias**: existing `/bookings/:bookingId` already matches canonical

#### Profile (tab id: `profile`) — requires auth
- **`/profile`**: user profile

#### Admin (tab id: `admin`) — requires admin
- **`/admin`**: redirect to `/admin/fighters`
- **`/admin/fighters`**
- **`/admin/services`**
- **`/admin/schedule`**
- **`/admin/bookings`**
- **`/admin/bookings/:bookingId`**

Admin UX constraint:
- **No nested tab bars**. Main tab bar remains only bottom tab bar across app shell.
- Existing admin-only `ion-tabs` implementation must be replaced with normal routed pages under same shell router outlet.

---

## App Shell Layout Contract

### Bottom tab bar (persistent)

- **Visible on**: all routes in app shell (Explore/Bookings/Profile/Admin).
- **Not visible on**: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- **Tabs** (left → right):
  - Explore (icon: `compass-outline` or `search-outline`)
  - Bookings (icon: `calendar-outline`)
  - Profile (icon: `person-outline`)
  - Admin (icon: `shield-checkmark-outline`), **hidden unless admin**

### Tab selection rules (URL-driven)

- Tab considered active by **first path segment**:
  - `/explore/...` → Explore active
  - `/bookings/...` → Bookings active
  - `/profile` → Profile active
  - `/admin/...` → Admin active
- Deep links into subroutes must keep correct tab selected (reason for canonical prefixes above).

### Tab press behavior (non-linear history safe)

- Pressing a tab navigates to that tab root:
  - Explore → `/explore`
  - Bookings → `/bookings`
  - Profile → `/profile`
  - Admin → `/admin/fighters`
- Re-pressing currently active tab must also navigate to tab root (acts as “pop to root”).
- Tab switching must not rely on `LocationStrategy.historyGo()` or custom back-stack arrays.

---

## Header + Back Contract (locked)

### Shared header pattern

All **primary pages** must use same header layout:
- `ion-header` + `ion-toolbar`
- left slot: explicit back affordance
- center: page title
- right slot: optional actions (rare; do not add in this phase)

### Back arrow behavior (exact)

- Use `ion-back-button` in header start slot.
- Always set:
  - `defaultHref="/explore"`
  - `text=""` (icon-only)
- Rules:
  - If Ionic navigation stack has history: back pops within current stack (tab stack).
  - If there is no history (direct deep link, app cold start, etc.): back navigates to `/explore`.
  - Back must never navigate to removed Home page.

### Title rules

- Title is screen-specific (e.g. “Explore”, “Bookings”, “Profile”, “Admin”, “Booking”, “Fighter”).
- Title must not include route segments or IDs.

---

## Auth + Admin Gating (UI + routing)

### Auth-required destinations

- Bookings tab (`/bookings/**`)
- Profile tab (`/profile`)
- Booking detail (`/bookings/:bookingId`)

If unauth user attempts auth-required route:
- redirect to `/login?returnTo=<originalPathWithQuery>`
- after login success: navigate to `returnTo` when valid, else `/explore`

Open-redirect safety (contract):
- `returnTo` accepted only when it is an **in-app relative path starting with `/`** and does **not** start with `//`.
- Otherwise ignore and route to `/explore`.

### Admin tab visibility + access

- **Visibility**: Admin tab hidden unless `user.isAdmin === true`.
  - Secure default: while user profile unknown/loading, hide Admin tab.
- **Routing**:
  - Unauth access to `/admin/**` → `/login?returnTo=/admin/...`
  - Auth but non-admin access to `/admin/**` → redirect to `/explore` (no access)

---

## Deep Link + Back Behavior (acceptance-critical)

### Deep link landing rules

- Any deep link to canonical routes lands inside app shell and selects correct tab:
  - `/explore/fighters/:id` → Explore selected
  - `/bookings/:id` → Bookings selected (auth required)
  - `/admin/bookings/:id` → Admin selected (admin required)
- Deep link to legacy aliases redirects to canonical prefixed routes before render so tab selection correct.

### Back rules for deep links

- When user opens a deep link cold (no prior history):
  - header back goes to `/explore` (via `defaultHref`)
- When user navigated within tab stack:
  - back returns to previous page inside that tab stack
- Switching tabs:
  - does not create confusing “cross-tab” back chains; back remains deterministic within current tab stack, else falls back to `/explore`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none | not applicable |

---

## Acceptance Checklist (Phase 8)

### Routing defaults (R3)
- [ ] Visiting `/` lands on `/explore`.
- [ ] Visiting unknown URL (wildcard) lands on `/explore`.
- [ ] `/home` removed/disabled (no user flow leads to Home; route not default).
- [ ] Login success navigates to `returnTo` when provided and safe; otherwise `/explore`.

### Header + back affordance (R3)
- [ ] All primary pages use consistent header chrome (same layout).
- [ ] Back arrow visible top-left on primary pages.
- [ ] Back arrow works when history exists (pops).
- [ ] Back arrow works when no history (falls back to `/explore`).

### Tab bar (R4)
- [ ] Tab bar visible across app shell.
- [ ] Tabs exist: Explore / Bookings / Profile / Admin.
- [ ] Admin tab hidden unless admin.
- [ ] Press tab navigates to that tab root.
- [ ] Re-press active tab returns to tab root.

### Deep links + back behavior (R4)
- [ ] Deep link `/explore/fighters/:id` selects Explore tab.
- [ ] Deep link legacy `/fighters/:id` redirects to `/explore/fighters/:id` and selects Explore.
- [ ] Deep link `/bookings/:id` selects Bookings tab (after login if needed).
- [ ] Deep link `/admin/...` selects Admin tab only for admins; non-admin redirected to `/explore`.
- [ ] Back from cold deep link goes to `/explore` (not Home).

