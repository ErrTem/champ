# Phase 9: Registration upgrades — Context

**Gathered:** 2026-04-26  
**Status:** Ready for planning  
**Source:** `.planning/ROADMAP.md` + `.planning/REQUIREMENTS.md` (R5) + `.planning/todos/pending/2026-04-26-registration-upgrades.md`

<domain>
## Phase Boundary

Deliver registration/login upgrades across backend (NestJS) + frontend (Ionic/Angular):

- OAuth sign-in/up: Google + Apple
- Registration form upgrades:
  - phone field required, USA prefix + input mask
  - required checkbox: 18+ confirmation
  - required checkbox: accept terms + Terms page route
  - choose profile type: fighter vs regular user
- Fighter approval workflow:
  - fighter registrations start **pending**
  - UI communicates pending status
  - backend enforces pending restrictions
  - admin can approve fighter accounts

Out of scope for Phase 9:

- Booking UX + rules fixes (Phase 10)
- Gyms + timezone, fighter self-serve, notifications, social

</domain>

<decisions>
## Implementation Decisions (Locked)

### Identity + session
- Preserve current cookie-based session model (httpOnly cookies set by backend).
- OAuth completion must end in same session shape as password login: set cookies and return safe user DTO.

### Registration gating
- Client blocks submit unless phone valid + both checkboxes checked + profile type chosen.
- Server validates same constraints (do not trust client).

### Roles + approval state
- Add explicit user profile type for fighter vs regular user.
- Fighter type requires approval; default state on registration is **pending**.
- Pending fighters must be blocked from fighter-only actions (future Phase 12), but can still log in and use normal user flows unless explicitly restricted by this phase plan.

### Admin approval
- Backend provides admin-only endpoints to list pending fighter users and approve them.
- Frontend provides minimal admin UI to approve.

</decisions>

<canonical_refs>
## Canonical References

### Requirements / phase drivers
- `.planning/ROADMAP.md` — Phase 9 definition
- `.planning/REQUIREMENTS.md` — R5 acceptance criteria
- `.planning/todos/pending/2026-04-26-registration-upgrades.md` — driver notes

### Current registration/auth implementation (baseline)
- `src/app/pages/register/register.page.ts`
- `src/app/pages/register/register.page.html`
- `src/app/core/services/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/prisma/schema.prisma` (User model)

</canonical_refs>

<specifics>
## Specific Ideas

- Keep password registration (email+password) working; OAuth adds alternate path.
- Prefer DB-backed identity linking for OAuth providers (provider + providerUserId + userId + createdAt).
- Terms page content can be mock/static but must exist and be linked.
- Phone stored normalized (E.164 preferred) or at least consistently formatted.

</specifics>

<deferred>
## Deferred Ideas

- Full fighter self-serve UX (Phase 12).
- Strong phone verification (SMS) — not requested in R5.

</deferred>

---

*Phase: 09-registration-upgrades*  
*Context gathered: 2026-04-26*
