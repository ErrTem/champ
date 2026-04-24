---
phase: 1
slug: platform-auth
status: approved
shadcn_initialized: false
preset: none
created: 2026-04-24
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for **Platform & auth** (register, login, password reset, profile). Grounded in `DESIGN.md` (Elite Athletic Editorial / Kinetic Gallery) and the static HTML references `register.html` and `login.html`. Ionic implementation must preserve these contracts (map tokens to global CSS variables or theme, not ad-hoc hex in components).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Ionic + Angular; Tailwind optional in mocks only) |
| Preset | Elite Athletic Editorial — see `DESIGN.md` |
| Component library | Ionic UI primitives + shared app layout components |
| Icon library | Material Symbols Outlined (stroke-forward, default FILL 0, wght 300) |
| Font | **Inter** (display / headlines / power), **Manrope** (body / labels / precision) |

**Canonical visual reference:** Same shell for all transactional auth screens: fixed **TopAppBar** (glass: `surface` ~70% opacity + `backdrop-blur`), full-bleed **desaturated hero** with vertical gradient scrim to `background`, single-column form `max-w-md` (28rem), gutter `px-6` (1.5rem).

**No-line rule:** Avoid 1px solid section borders; use tonal surfaces and `outline` at `outline-variant` **15%** opacity for focus rings only (see DESIGN.md).

---

## Spacing Scale

Declared values (multiples of 4px). Align with Tailwind numeric scale used in mocks.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight icon gaps, checkbox to label |
| sm | 8px | Stack between related controls |
| md | 16px | Default field vertical rhythm (`space-y-4`) |
| lg | 24px | Form block separation (`space-y-6`) |
| xl | 32px | Headline to form |
| 2xl | 48px | `pt-24` under fixed header |
| 3xl | 64px | Major page vertical breathing (hero to content) |

Exceptions: none.

---

## Typography

| Role | Size | Weight | Line height | Notes |
|------|------|--------|-------------|--------|
| Display (screen title) | 36–48px (`text-4xl` / `md:text-5xl`) | 900 (black) | tight (`leading-none`) | Inter, `tracking-tighter`, uppercase for hero lines |
| Section kicker | 12px | 700 | normal | Manrope, `tracking-[0.2em]` uppercase, `secondary` |
| Body | 14px | 500 | relaxed | Manrope, `on-surface` / `on-surface-variant` |
| Label (field) | 10px | 800 | normal | Manrope, uppercase `tracking-widest`, `on-surface-variant`; **focus-within → `primary`** on group |
| CTA | inherit button | 900 | — | Inter/Manrope per mock, uppercase `tracking-[0.2em]` |

---

## Color

Semantic tokens (Tailwind `theme.extend.colors` in mocks; replicate as CSS variables in app).

| Role | Token / hex | Usage |
|------|-------------|--------|
| Dominant (canvas) | `background` / `surface` `#131313` | Page base, scrim endpoints |
| Elevated fields | `surface-container-highest` `#353535` | Input fill |
| Field focus surface | `surface-variant` `#353535` | Input background on focus |
| Primary text | `on-surface` `#e2e2e2` | Default copy |
| Muted | `on-surface-variant` `#ebbbb4` | Secondary copy, placeholders use neutral only at **low** opacity if needed; prefer `on-surface-variant` |
| Accent (brand energy) | `primary` `#ffb4a8`, `primary-container` `#ff5540` | Wordmark accents, links, focus; **CTA gradient** 135deg primary → primary-container |
| Premium accent | `secondary` `#e9c349` | Kickers, secondary links (“Sign up”), exclusive badges |
| Destructive / error | `error` `#ffb4ab`, `error-container` `#93000a` | Errors only (not brand chrome) |

Accent reserved for: primary CTA, text links, focus states, kinetic highlights — **not** full-page backgrounds.

**Glass header:** `background` or `surface` at ~70% opacity + blur 16–40px; gradient hairline from top optional (`from-black/20 to-transparent`).

---

## Screen inventory & layout (Phase 1)

| Screen | Layout contract |
|--------|------------------|
| Register | Hero headline left-aligned on `md+`, centered on small; fields stacked; TOS checkbox; primary CTA full width |
| Login | Same shell as register; email + password; optional “Forgot password?” text link; optional social row **below** primary CTA with “Or continue with” divider |
| Password reset (request + confirm) | Reuse login/register shell; single-column; calm copy |
| Profile (AUTH-05) | Same tokens; editable fields match **register input** pattern |

**Cross-links:** Secondary link style `secondary` bold, hover to `secondary-fixed`; mirror “Already have an account? **SIGN IN**” pattern for inverse flow.

---

## Components

### Primary button

- Class name in mocks: **`kinetic-gradient`** — linear-gradient 135deg `primary` → `primary-container`, text `on-primary`, rounded `rounded-lg` (0.25rem), full width on forms, optional trailing Material icon (`arrow_forward` or context-appropriate).
- Shadow: large diffuse `shadow-2xl shadow-primary/20` acceptable per “ambient” rule in DESIGN.md.

### Text inputs

- Container: `w-full bg-surface-container-highest border-none rounded-lg p-4 text-on-surface`
- Outline: `outline outline-1 outline-outline-variant/15 focus:outline-primary/40`, `focus:ring-0`, `focus:bg-surface-variant`
- Placeholder: `placeholder:text-neutral-600` acceptable in static HTML; Ionic app should use `on-surface-variant` at ~38% opacity for placeholders to satisfy “no flat gray” spirit.

### Social buttons (login only)

- `ghost-border` utility: `1px solid` `outline` at **15%** opacity (not maroon/red bespoke borders).
- Background `surface-container-low`, hover `surface-container-high`.

### Header

- Height ~64px (`h-16`), horizontal padding `px-6`, back control `w-10 h-10`, centered wordmark **ELITE ATHLETIC** — use **`text-primary`** (not raw `red-500`) for brand alignment with tokens.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Register primary CTA | “Create Account” |
| Login primary CTA | “Log In” (same button styling as register) |
| Register kicker | Contextual phase label (e.g. “Phase One” in mock — replace with product-appropriate kicker in app) |
| Forgot password | “Forgot password?” (sentence case link) |
| Empty profile | “Complete your profile” / “Add your details so bookings stay accurate.” |
| Error (auth) | Short problem + path (“Check your email and password” / “Request a new link”) |
| Destructive (logout) | “Log out” : “You will need to sign in again on this device.” |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|---------------|-------------|
| shadcn official | none | not required |
| Ionic | ion-* as needed | follow Ionic theming; no conflicting global resets |

---

## Implementation notes (Ionic)

- Map token hex values to `:root` or Ionic CSS variables once; screens consume semantic names.
- **httpOnly cookie** auth (per `01-CONTEXT.md`) does not change visual contract.
- Validate **Safe Area** and fixed header overlap on iOS (Capacitor); maintain `min-h-screen` / `100dvh` behavior.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS (unified shell, glass, hero scrim)
- [x] Dimension 3 Color: PASS (token-driven; no login-only maroon hex)
- [x] Dimension 4 Typography: PASS (Inter + Manrope roles)
- [x] Dimension 5 Spacing: PASS (4px rhythm, gutter 6)
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-24 (inline with HTML reference alignment)

---

## UI-SPEC COMPLETE
