# Phase 6: Admin - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff-only admin area (UI routes + backend APIs) to manage fighters, services/prices, and schedule rules that drive slot generation, plus operational read-only booking visibility.

No new customer capabilities in this phase (no user-facing search, chat, reviews, etc).
</domain>

<decisions>
## Implementation Decisions

### Admin access model (ADM-01)
- **D-01:** Single role: **admin** (one role grants all admin powers).
- **D-02:** First admin provisioned via **seed/script/env** (not via public UI).
- **D-03:** Admin UI reachable from **Profile** page, link visible only when logged-in user is admin (route still guarded).

### Admin UI structure (ADM-01..05)
- **D-04:** Admin UI is **responsive Ionic** (usable on phone + desktop).
- **D-05:** Admin navigation uses **tabs** for sections.
- **D-06:** Admin UI includes **all 4 sections** in Phase 6:
  - Fighters
  - Services/prices
  - Schedule
  - Bookings (read-only)

### Schedule editing semantics (ADM-04)
- **D-07:** Admin edits **weekly schedule rules** (day-of-week + start/end window), matching current `FighterScheduleRule` model.
- **D-08:** Slot regeneration horizon: **rolling 30 days ahead**.
- **D-09:** Schedule edits must **never modify slots with confirmed bookings**; those remain as-is.
- **D-10:** Admin inputs/displays schedule times in **America/Los_Angeles** (carry-forward timezone policy).

### Admin booking visibility (ADM-05)
- **D-11:** Admin can view **all bookings across all fighters**.
- **D-12:** Bookings list filters required in v1:
  - Status
  - Date range (slot start time)
  - Fighter
- **D-13:** Booking actions are **read-only only** in Phase 6 (no cancel, no mutation).

### Claude's Discretion
- Exact UI layout within tab sections, empty/error states, field grouping, and component reuse.
- Exact admin route paths (`/admin/...`) as long as separated + guarded.
- Exact DB representation for admin role (boolean vs enum), as long as it supports the single admin role requirement and is seedable.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope / acceptance
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, and plan breakdown (06-01..06-03).
- `.planning/REQUIREMENTS.md` — ADM-01..ADM-05 acceptance criteria.
- `.planning/PROJECT.md` — project scope + constraints (boring/debuggable stack; payments/PII care).

### Carry-forward constraints
- `.planning/phases/01-platform-auth/01-CONTEXT.md` — cookie-based auth; iOS/WKWebView cookie constraints.
- `.planning/phases/03-slots-booking-pre-payment/03-CONTEXT.md` — timezone policy baseline (UTC storage; display policy) and slot/booking invariants.
- `.planning/phases/05-my-bookings-notifications/05-CONTEXT.md` — “no cancel action” precedent in v1 + timezone carry-forward.

### UI/design
- `DESIGN.md` — visual rules (“no-line rule”, tonal layering) to follow in admin UI too.

### Current implementation touchpoints (to extend)
- `src/app/app.routes.ts` — existing app routing (add guarded admin routes).
- `src/app/core/guards/auth.guard.ts` — auth guard pattern (admin guard will mirror this).
- `src/app/core/services/auth.service.ts` — `loadProfile()` (`/users/me`) used to determine auth/admin state.
- `backend/prisma/schema.prisma` — `User`, `Fighter`, `Service`, `FighterScheduleRule`, `Slot`, `Booking` models (admin role field will extend `User`).
- `backend/src/auth/guards/jwt-access.guard.ts` — backend auth guard pattern for controllers.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Frontend route guards already exist (`authGuard`) and user profile load already central (`AuthService.loadProfile()`).
- Backend uses NestJS guards (`JwtAccessAuthGuard`) and Prisma models for all admin-managed entities.

### Established Patterns
- Cookie-based auth (`withCredentials: true`) + refresh-on-401 interceptor pattern on frontend.
- Backend controller auth via `@UseGuards(JwtAccessAuthGuard)` and `req.user.sub`.

### Integration Points
- Add admin-only backend controllers/services for CRUD on `Fighter` and `Service`, schedule rule CRUD on `FighterScheduleRule`, and read-only booking list/detail.
- Add admin-only Ionic routes + pages under `/admin` with tabs for sections; link entry from Profile when admin.
</code_context>

<specifics>
## Specific Ideas

- No extra booking actions in admin v1 beyond read-only visibility.
</specifics>

<deferred>
## Deferred Ideas

- Booking cancellation action (admin-initiated) — new capability; separate phase if needed.
- Per-fighter timezone — new concept; defer unless requirements change.
</deferred>

---

*Phase: 06-admin*
*Context gathered: 2026-04-25*
