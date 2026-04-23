# Phase 1: Platform & auth - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can register, log in, log out, recover password, and maintain a basic profile; backend and PostgreSQL exist with deployment-ready config stubs. Scope is AUTH-01 through AUTH-05 only — no catalog, booking, or payments in this phase.

</domain>

<decisions>
## Implementation Decisions

### Persistent login (AUTH-02)

- **D-01:** Short-lived **access token** plus **refresh token** delivered/stored in an **httpOnly cookie** (or equivalent first-party cookie strategy), not long-lived tokens in `localStorage`.
- **D-02:** User accepted the recommended direction from discuss-phase (“agree” with the proposed model).

### Backend API (Phase 1 scaffold)

- **D-03:** **NestJS** for the API server (auth module, future domain modules aligned with Angular structure).

### Password reset email (AUTH-04)

- **D-04:** **Development logging** of reset links/tokens in Phase 1, with a **clear, documented swap** to a real transactional provider (e.g. Resend, SendGrid, SES) for staging/production.

### Profile fields (AUTH-05)

- **D-05:** Required profile fields for bookings: **name**, **email**, **phone** — all readable/updatable by the owning user per requirements.

### iOS bundle (milestone 1)

- **D-06:** The app will be **bundled for iOS** in milestone 1 (Capacitor-style native shell). Planning and implementation must **validate auth persistence on iOS** (simulator + device): WKWebView cookie behavior, `SameSite` / `Secure` if API origin differs from the app origin, CORS/credentials, and any Capacitor-specific constraints. Treat “works in mobile Safari” as necessary but not sufficient until verified in the packaged app.

### Claude's Discretion

- Exact access/refresh TTLs, rotation policy, and cookie names/paths.
- NestJS module layout and DTO validation details.
- Ionic page structure and styling for auth/profile screens.
- Email provider adapter interface and env keys for the production swap.

</decisions>

<specifics>
## Specific Ideas

- iOS packaging is an explicit milestone-1 constraint — prioritize early smoke tests of login/session on the native wrapper, not only browser dev.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-05 acceptance criteria and traceability.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, and plan breakdown (01-01 … 01-04).
- `.planning/PROJECT.md` — Vision, constraints (boring stack, compliance surface), out-of-scope items.

### Prior research (non-binding but informative)

- `.planning/research/STACK.md` — Suggested backend/auth/data stack options (NestJS aligns with user lock-in).
- `.planning/research/ARCHITECTURE.md` — Component boundaries and suggested build order (DB + auth + health first).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Ionic 8 + Angular 20 standalone bootstrap (`src/main.ts`, `provideIonicAngular`, `provideRouter` with `PreloadAllModules`).
- Minimal routing: `home` + default redirect (`src/app/app.routes.ts`).

### Established Patterns

- No `HttpClient`, interceptors, guards, or auth services yet — **greenfield** for API client + auth state + route guards.

### Integration Points

- Extend `app.routes.ts` with auth and profile routes; add an API base URL + HTTP layer; guard routes that will later protect booking flows (Phase 1: at minimum post-login / profile shell).

</code_context>

<deferred>
## Deferred Ideas

- OAuth / social login, 2FA — v2 (`REQUIREMENTS.md` AUTHV2-*).
- Push notifications — out of scope for v1 web-first; revisit with native milestones if needed.

</deferred>

---

*Phase: 01-platform-auth*
*Context gathered: 2026-04-24*
