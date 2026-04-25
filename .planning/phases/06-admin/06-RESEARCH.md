# Phase 6: Admin - Research

**Researched:** 2026-04-25  
**Domain:** Admin authz + CRUD + schedule regeneration + booking ops list  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADM-01 | Authorized staff access admin area separated from customer routes | Add `User.isAdmin` (or enum role). Backend `AdminGuard` layered on `JwtAccessAuthGuard`. Frontend `adminGuard` layered on `authGuard` + profile flag. |
| ADM-02 | CRUD fighters shown in catalog | Admin-only fighters CRUD endpoints that write `Fighter.published` + fields. Public `GET /fighters` already filters `published: true` [VERIFIED: codebase]. |
| ADM-03 | Manage services attached to fighter (duration/modality/price) | Admin-only services CRUD endpoint(s) writing `Service.published` + fields. Public fighter profile already filters `services.published: true` [VERIFIED: codebase]. |
| ADM-04 | Manage schedule rules driving public slots | Reuse `FighterScheduleRule` (dayOfWeek/startMinute/endMinute, PT minutes) [VERIFIED: codebase]. Add regeneration routine for rolling 30 days, preserve confirmed slots. |
| ADM-05 | View bookings for ops support (read-only ok) | Admin-only bookings list endpoint joining fighter/service/user/slot, filters: status/date range/fighter. No mutation. |
</phase_requirements>

## Summary

Admin work splits into 4 pillars: (1) role bit in `User` + seed path, (2) backend authz guard pattern reused across admin controllers, (3) admin CRUD endpoints wired to existing `published` flags so public catalog updates immediately, (4) schedule regeneration routine that creates missing slots and deletes only safe slots (never confirmed). [VERIFIED: codebase]

Existing stack already close: NestJS + Prisma + Luxon timezone policy + Jest e2e tests + Ionic auth guard. Biggest planning risk: regen semantics (what to delete vs keep) and making admin/public APIs consistent with `published` fields. [VERIFIED: codebase] [ASSUMED]

**Primary recommendation:** Add `User.isAdmin` boolean, implement backend `AdminGuard` (403 if not admin), build `/admin/*` controllers for fighters/services/schedule/bookings, implement slot regeneration as “recompute desired starts for 30 days, createMany skipDuplicates, deleteMany only non-confirmed + non-reserved”. [VERIFIED: codebase] [ASSUMED]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Admin role/authz | API / Backend | Client | Backend must enforce; client only hides links + guards UX. |
| Admin CRUD fighters/services/schedule | API / Backend | DB / Storage | Writes Prisma models; public reads depend on same tables. |
| Schedule regeneration | API / Backend | DB / Storage | Slot tables authoritative; regen must be transactional + safe deletes. |
| Admin bookings read-only list | API / Backend | DB / Storage | Needs joins + filters + deterministic ordering. |

## Project Constraints (from .cursor/rules/)

- Enforced workflow defaults: `workflow.nyquist_validation: true`, `workflow.security_enforcement: true`, `security_asvs_level: 1`, block on high severity. [VERIFIED: codebase: `.planning/config.json`]
- Follow existing Angular/Ionic patterns until conventions doc exists. [VERIFIED: codebase: `.cursor/rules/gsd-project-context.md`]
- Caveman communication style only (planning docs ok normal). [VERIFIED: codebase: `.cursor/rules/caveman.mdc`]

## Standard Stack

### Core (existing)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS (`@nestjs/*`) | ^11 | API modules, controllers, guards | Already used for auth/bookings/payments. [VERIFIED: codebase: `backend/package.json`] |
| Prisma (`@prisma/client`) | ^6 | DB ORM | All domain models already Prisma. [VERIFIED: codebase] |
| Luxon | ^3.7 | PT↔UTC conversions | Availability uses `America/Los_Angeles` conversions. [VERIFIED: codebase] |
| Jest + Supertest | ^29 + ^7 | e2e validation | Existing e2e suite for bookings/payments. [VERIFIED: codebase] |

### Supporting (existing patterns)
| Library/Pattern | Purpose | When to Use |
|---|---|---|
| Nest `@UseGuards(JwtAccessAuthGuard)` | Auth required | All admin endpoints. [VERIFIED: codebase] |
| Prisma `createMany({ skipDuplicates: true })` | Idempotent slot creation | Regen and availability warm-up. [VERIFIED: codebase] |

## Recommended API Surface (Admin)

Goal: keep public API unchanged; add admin-only namespace with explicit authz.

### Authz

- `GET /users/me` includes `isAdmin` (or `role`) so frontend can show Admin link + guard. [ASSUMED]
- Backend rejects non-admin with 403 (not 404), stable JSON error `{ code: 'ADMIN_REQUIRED' }` optional. [ASSUMED]

### Fighters (ADM-02)

- `GET /admin/fighters?includeUnpublished=true|false` → list fighters with `published` + minimal fields.
- `POST /admin/fighters` → create fighter, default `published=false` unless set.
- `PATCH /admin/fighters/:id` → update fields + publish toggle.

DB touch: `Fighter.published` already exists and drives public `GET /fighters` and `GET /fighters/:id` filters. [VERIFIED: codebase]

### Services (ADM-03)

Two viable shapes; pick 1 and keep consistent.

Option A (nested under fighter) [ASSUMED]:
- `GET /admin/fighters/:fighterId/services`
- `POST /admin/fighters/:fighterId/services`
- `PATCH /admin/services/:serviceId`

Option B (flat with fighterId in body) [ASSUMED]:
- `GET /admin/services?fighterId=...`
- `POST /admin/services` (requires fighterId)
- `PATCH /admin/services/:id`

DB touch: `Service.published` already exists and public fighters endpoints filter it. [VERIFIED: codebase]

### Schedule rules (ADM-04)

- `GET /admin/fighters/:fighterId/schedule-rules` → list active/inactive rules.
- `PUT /admin/fighters/:fighterId/schedule-rules` → replace full weekly config (recommended to keep UI simple + deterministic). [ASSUMED]
  - Body: array of `{ dayOfWeek, startMinute, endMinute, active }`.
  - Server validation: dayOfWeek 0..6, 0<=start<end<=1440, no overlaps per day (optional v1, but prevents weird regen). [ASSUMED]
- Side effect: calls regeneration for horizon \(now..now+30d). [ASSUMED]

### Bookings ops list (ADM-05)

- `GET /admin/bookings?status=...&from=YYYY-MM-DD&to=YYYY-MM-DD&fighterId=...&cursor=...`
  - Filter semantics: `from/to` apply to slot `startsAtUtc` after converting date bounds from PT day start/end to UTC. [ASSUMED]
  - Order: `slot.startsAtUtc asc, booking.id asc` for deterministic pagination. Mirrors My Bookings determinism style. [VERIFIED: codebase pattern]
- Optional: `GET /admin/bookings/:id` detail (read-only). [ASSUMED]

Return shape should include minimal user identity (name/email) + fighter/service + slot times + booking/payment status. [ASSUMED]

## DB Changes (Role model + indexes)

### Admin role field

Add to `User`:
- `isAdmin Boolean @default(false)` (simplest) [ASSUMED]
  - Alternative: `role String @default("user")` with enum-like values (`user|admin`). [ASSUMED]

Why boolean fits constraints: single admin role only (D-01). [VERIFIED: Phase 06 context]

### Booking list query support

Admin bookings list filters by status + date range + fighter, and joins slot + user.
Current schema indexes exist on `Booking.fighterId/serviceId/slotId/userId` and `Slot.startsAtUtc` missing index; consider add:
- `@@index([startsAtUtc])` on `Slot` OR composite on `Slot(fighterId, startsAtUtc)` if query uses slot table; but admin query likely starts from `Booking` joined to `slot`. [ASSUMED]

Planning note: decide query direction early (Prisma select join vs raw SQL) then add index accordingly. [ASSUMED]

## Authz Guard Pattern (Backend)

Current auth guard:
- `JwtAccessAuthGuard` populates `req.user.sub` + `email` only. [VERIFIED: codebase]

Admin enforcement options:

1) **AdminGuard** (recommended):
   - `@UseGuards(JwtAccessAuthGuard, AdminGuard)` on admin controllers. [ASSUMED]
   - `AdminGuard` loads user by `req.user.sub`, checks `isAdmin`. Cache per request (store on `req` or use Nest request-scoped provider) to avoid double DB hits. [ASSUMED]
   - Pros: no JWT schema change; role updates take effect immediately. Cons: extra DB hit per admin request. [ASSUMED]

2) Embed role in JWT access payload:
   - Add `isAdmin` to access token payload at issue time. [ASSUMED]
   - Needs update `JwtAccessStrategy.validate`, update token issuance in `AuthService.issueSession`. [VERIFIED: codebase touchpoints] [ASSUMED]
   - Risk: role changes require waiting for token refresh. [ASSUMED]

Given “CRUD changes reflect immediately” requirement targets catalog, but admin role changes also should reflect quickly; DB-checked guard avoids token staleness. [ASSUMED]

## Frontend Route + Tabs Structure (Ionic)

Existing:
- `authGuard` calls `AuthService.loadProfile()` and redirects to `/login`. [VERIFIED: codebase]
- `AuthUser` type has no `isAdmin` yet. [VERIFIED: codebase]

Recommended:
- Add `adminGuard`:
  - ensures `authGuard` already passed (or inline: call `loadProfile`, require `u?.isAdmin`). [ASSUMED]
  - redirect non-admin to `/profile` (UI-SPEC) and toast “Admin access required”. [VERIFIED: UI-SPEC intent] [ASSUMED]
- Routes:
  - `/admin` → AdminTabsShellPage (tabs)
    - `/admin/fighters`
    - `/admin/services`
    - `/admin/schedule`
    - `/admin/bookings`
  - apply `canActivate: [adminGuard]` at parent if using child routes. [ASSUMED]
- Profile page:
  - show Admin link only if `auth.user()?.isAdmin`. [VERIFIED: Phase 06 context] [ASSUMED]

## Schedule Regeneration: Algorithm Outline (ADM-04)

Reality today:
- Slots created lazily by `GET /availability`: generate candidate slots for requested range using active `FighterScheduleRule` + service duration + 30-min step, `createMany(skipDuplicates)`. [VERIFIED: codebase]
- `Slot` has `confirmedBookingId` marker; availability hides confirmed and active reservations. [VERIFIED: codebase]

Admin regen goal:
- On schedule rules change, enforce rolling 30 days horizon (D-08) for affected fighter (and likely per service). [VERIFIED: Phase 06 context] [ASSUMED]
- Never modify slots with confirmed bookings (D-09): interpreted as never delete/alter rows where `confirmedBookingId != null`. [VERIFIED: schema + context]

Recommended regen routine (per fighterId):

1) Compute horizon bounds:
   - `startLocal = now().setZone('America/Los_Angeles').startOf('day')`
   - `endLocalExclusive = startLocal.plus({ days: 30 })`
   - Convert to UTC for DB range filters. [VERIFIED: codebase timezone patterns]

2) Load fighter schedule rules (active only) + services to generate for:
   - Decide: only `Service.published=true` or all services; UI wants manage published anyway. Suggest generate for published services only to avoid leaking unpublished options into availability queries. [ASSUMED]

3) Generate desired candidate slots:
   - Reuse existing slot generator logic (same as `AvailabilityService.generateCandidateSlots`) for each service duration. [VERIFIED: codebase reuse opportunity]
   - Output desired set keyed by `(fighterId, serviceId, startsAtUtc)` (unique constraint exists). [VERIFIED: schema.prisma]

4) Create missing:
   - `slot.createMany({ data: desired, skipDuplicates: true })`. [VERIFIED: codebase]

5) Delete obsolete (safe only):
   - Identify slots in horizon for fighter (and service ids) that are NOT in desired set.
   - Delete only when:
     - `confirmedBookingId == null` (never delete confirmed)
     - AND `reservedBookingId == null` OR `reservedUntilUtc < nowUtc` (avoid breaking in-flight holds) [ASSUMED]
   - Use `deleteMany` by id list or by NOT IN desired starts; Prisma may require two-step (query ids then deleteMany). [ASSUMED]

6) Never update starts/ends of existing slots; treat as immutable. Create new slots + delete safe old slots instead. Helps invariant “never modify confirmed slots”. [ASSUMED]

Edge: DST transitions in `America/Los_Angeles`.
- Because rules stored as minutes-since-midnight PT and Luxon converts to UTC, some local times may map differently around DST; generation must use timezone-aware DateTime (already does). [VERIFIED: codebase]

## Don’t Hand-Roll

| Problem | Don’t Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone math / DST | Custom offset math | Luxon DateTime with zone conversions | DST edge cases, off-by-one-day errors. [VERIFIED: codebase] |
| Authz enforcement | Frontend-only guard | Backend Nest guards | Client bypass trivial; must enforce server-side. [VERIFIED: codebase pattern] |
| Concurrency safety | Best-effort checks | Prisma transactions + updateMany guards | Booking flow already uses this pattern. [VERIFIED: codebase] |

## Common Pitfalls

### Pitfall: Deleting reserved slots breaks checkout/hold
**What goes wrong:** Admin edits schedule; regen deletes slot currently reserved by awaiting-payment booking; booking later fails or becomes inconsistent.  
**How to avoid:** Never delete slot with `reservedBookingId != null` and `reservedUntilUtc >= now`. Treat reserved same as protected. [ASSUMED]

### Pitfall: Public catalog shows stale because admin toggles wrong flag
**What goes wrong:** Admin thinks “deactivate” but edits different boolean; public APIs still include fighter/service.  
**How to avoid:** Use existing `published` booleans (Fighter/Service) as admin “active” toggle; name UI “Published” or map to “Active” but write `published`. [VERIFIED: codebase] [ASSUMED]

### Pitfall: Time filters applied in UTC but UI thinks PT
**What goes wrong:** Admin bookings filter “from/to date” returns wrong rows around midnight.  
**How to avoid:** Treat input dates as PT days; convert day start/end to UTC bounds in query. Same policy as availability. [VERIFIED: codebase timezone policy] [ASSUMED]

## Environment Availability

Step 2.6: SKIPPED (phase code/config only; no new external services identified). [ASSUMED]

## Validation Architecture (Nyquist)

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest e2e (Supertest) |
| Config file | `backend/jest.config.*` (implicit via Nest preset) [ASSUMED] |
| Quick run command | `npm test -- admin` (add focused pattern) [ASSUMED] |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Non-admin blocked from `/admin/*` APIs; admin allowed | e2e | `npm test -- admin.authz.e2e` | ❌ |
| ADM-02 | Fighters CRUD changes reflect in public `GET /fighters` immediately | e2e | `npm test -- admin.fighters.e2e` | ❌ |
| ADM-03 | Services CRUD changes reflect in public profile `GET /fighters/:id` immediately | e2e | `npm test -- admin.services.e2e` | ❌ |
| ADM-04 | Schedule update triggers regen; confirmed slot never deleted/changed | e2e | `npm test -- admin.schedule-regen.e2e` | ❌ |
| ADM-05 | Admin bookings list supports status/date range/fighter filters, deterministic order | e2e | `npm test -- admin.bookings.e2e` | ❌ |

### Wave 0 Gaps
- [ ] Add e2e helper to login as admin (cookie capture similar to existing tests). [VERIFIED: codebase patterns]
- [ ] Add prisma seed path for first admin user (env-driven) for local QA and tests. [ASSUMED]
- [ ] Add admin e2e specs under `backend/test/`. [ASSUMED]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing cookie JWT + refresh sessions. [VERIFIED: codebase] |
| V3 Session Management | yes | httpOnly cookies `access_token`/`refresh_token`. [VERIFIED: codebase] |
| V4 Access Control | yes | Backend guards: `JwtAccessAuthGuard` + `AdminGuard`. [ASSUMED] |
| V5 Input Validation | yes | DTO validation (`class-validator`) + explicit schedule rule validation. [VERIFIED: deps] [ASSUMED] |
| V6 Cryptography | yes | bcrypt for passwords; Stripe signature verify already. [VERIFIED: codebase] |

### Known Threat Patterns (admin)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal privilege escalation | Elevation | Enforce admin guard server-side, never rely on client link hiding. |
| Overbroad data exposure | Information disclosure | Admin bookings list returns minimal needed PII; avoid returning password hashes (already stripped). [VERIFIED: codebase] [ASSUMED] |
| CSRF-ish cookie risk | Tampering | Ensure CORS + SameSite policy consistent; admin endpoints same as rest. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- `backend/prisma/schema.prisma` — `FighterScheduleRule`, `Slot.confirmedBookingId`, `Fighter/Service.published` fields. [VERIFIED: codebase]
- `backend/src/availability/availability.service.ts` — slot generation + `createMany(skipDuplicates)` + PT timezone. [VERIFIED: codebase]
- `backend/src/bookings/*` — deterministic ordering and conflict contract patterns. [VERIFIED: codebase]
- `src/app/core/guards/auth.guard.ts` + `src/app/core/services/auth.service.ts` — frontend guard + `/users/me` profile load. [VERIFIED: codebase]
- `.planning/phases/06-admin/06-CONTEXT.md` + `06-UI-SPEC.md` — locked decisions + UI contract. [VERIFIED: codebase]

### Tertiary (LOW confidence)
- None.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Use `User.isAdmin` boolean vs role enum | DB Changes | Requires migration shape change; affects DTOs/guards. |
| A2 | Admin regen should not delete reserved (in-flight) slots | Regen pitfalls | If wrong, could allow deletion; might break active holds. |
| A3 | Regen should operate on published services only | Regen outline | If availability asks unpublished service (should not happen), missing slots. |
| A4 | Admin bookings filter dates treated as PT day bounds | Bookings ops list | Wrong timezone filtering confuses ops. |

## Open Questions (RESOLVED)

1. **Admin provisioning mechanism exact shape**
   - **RESOLVED:** `backend/prisma/seed.ts` supports env-driven upsert:
     - Env: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `ADMIN_NAME`
     - If env missing: no admin user created/updated
     - If env present: upsert user by email; set `isAdmin=true`; set hashed password

2. **Regen deletion policy**
   - **RESOLVED:** Treat **active holds as protected**.
   - Regen may delete obsolete slots only when all true:
     - `confirmedBookingId == null`
     - AND (`reservedUntilUtc == null` OR `reservedUntilUtc < nowUtc`)
   - This preserves confirmed bookings (D-09) and avoids breaking awaiting-payment holds.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — already in repo. [VERIFIED: codebase]
- Architecture: MEDIUM — admin endpoints + guard straightforward, regen deletion semantics needs decision. [ASSUMED]
- Pitfalls: MEDIUM — derived from existing slot/booking model, but admin ops patterns not yet implemented. [ASSUMED]

**Valid until:** 2026-05-25

