# Phase 14: Social sharing — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` (R10) + `.planning/todos/pending/2026-04-26-social-integrations-sharing.md`

<domain>
## Phase Boundary

Deliver social links + sharing affordance on fighter profile (Ionic/Angular client + NestJS API).

In scope:

- Fighter profile shows optional social links (when present): Instagram, Facebook, X/Twitter (exact labels decided in plan; fields stored as URLs or handles).
- Fighter profile has share action:
  - Web/PWA: **copy link** minimum (works everywhere).
  - Where available: use native/share sheet (Capacitor / `navigator.share`) for richer share UX.

Out of scope:

- Phase 11 timezones/gyms changes.
- Phase 13 notifications/calendar sync.
- Native app release work (but feature must stay Capacitor-friendly).
- Any growth loops beyond “share profile link”.

</domain>

<decisions>
## Implementation Decisions (Locked)

### Share contract (R10)
- Share action must work on web/PWA target with **copy link** fallback.
- Share sheet used where available (platform capability detection).

### Data model
- Social links optional; absence must not render empty UI.
- Public share link must be stable/canonical route for fighter profile (no legacy paths).

</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/REQUIREMENTS.md` — R10 acceptance criteria
- `.planning/todos/pending/2026-04-26-social-integrations-sharing.md`

### Current fighter profile implementation
- `src/app/pages/fighter-profile/fighter-profile.page.html`
- `src/app/pages/fighter-profile/fighter-profile.page.ts`

### Backend fighter model / API
- `backend/src/fighters/**`
- `backend/prisma/schema.prisma`

</canonical_refs>

<notes>
## Notes / Constraints

- UI already uses shared header/back pattern from Phase 8; keep consistent.
- Treat all user-provided URLs/handles as untrusted input; validate/sanitize before rendering as links.
- For share link, prefer canonical `/explore/fighters/:fighterId` route (per Phase 8 route map) unless code proves otherwise.

</notes>

---

*Phase: 14-social-sharing*  
*Context gathered: 2026-04-26*
