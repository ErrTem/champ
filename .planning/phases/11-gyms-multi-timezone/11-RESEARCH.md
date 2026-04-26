# Phase 11: Gyms + multi-timezone - Research

**Researched:** 2026-04-26  
**Domain:** NestJS + Prisma (PostgreSQL) + Luxon timezone math; Ionic/Angular map links + display policy  
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Timezone policy (core)
- Source of truth for timezone: `Gym.timezone` (IANA tz, e.g. `America/Los_Angeles`, `America/New_York`).
- All slot/booking timestamps stored unambiguously in DB (UTC instants), but:
  - generation windows
  - “day boundary” groupings (calendar views)
  - display formatting
  must use gym timezone.

### Fighter ↔ gym relationship
- Each fighter belongs to exactly 1 gym (for now).
- Default migration path: existing fighters assigned to default gym.

### Maps links
- UI provides “Show on map” action using a standard link format:
  - web: open Google Maps URL
  - iOS: prefer Apple Maps URL when available (fallback Google)

### Claude's Discretion
No explicit discretion items beyond implementation details implied by boundary.

### Deferred Ideas (OUT OF SCOPE)

- Multi-gym per fighter / fighter traveling schedule.
- Per-user timezone display preference (always show both gym time + user local).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R7 | Gyms domain + multi-timezone support | Backend already stores slot/booking instants in UTC (`startsAtUtc`, `endsAtUtc`, `expiresAtUtc`) and uses Luxon w/ hardcoded `AVAILABILITY_TIMEZONE='America/Los_Angeles'`. Phase must replace hardcode with `Gym.timezone` and add `Gym` + `Fighter.gymId` relation + map-link policy. [VERIFIED: codebase `backend/prisma/schema.prisma`, `backend/src/availability/availability.constants.ts`, `backend/src/availability/availability.service.ts`] |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

- Caveman communication style for chat only; code/docs normal. [VERIFIED: codebase `.cursor/rules/caveman.mdc`]
- Stack: Angular 20 + Ionic 8 (client), NestJS Node API + PostgreSQL + Prisma (server). Follow existing patterns. [VERIFIED: codebase `.cursor/rules/gsd-project-context.md`]
- Validation enabled (`workflow.nyquist_validation: true`). [VERIFIED: codebase `.planning/config.json`]
- Security enforcement enabled (ASVS L1, block on high). [VERIFIED: codebase `.planning/config.json`]

## Summary

Backend already models slots/bookings as UTC instants (`startsAtUtc`, `endsAtUtc`, `expiresAtUtc`) which matches locked timezone policy “store unambiguously”. However, availability generation, date grouping, and admin booking filters currently assume single hardcoded timezone `America/Los_Angeles` (`AVAILABILITY_TIMEZONE`). Phase 11 must introduce `Gym` with IANA timezone string and route all “local day boundary” computations through that per-gym timezone (derived via fighter → gym). [VERIFIED: codebase `backend/src/availability/availability.constants.ts`, `backend/src/availability/availability.service.ts`, `backend/src/admin/bookings.admin.service.ts`]

Prisma schema already contains a timezone-shaped smell: `FighterScheduleRule.startMinute/endMinute` comment says “Minutes since 00:00 in America/Los_Angeles”, so schedule rules currently implicitly tied to LA. With per-gym timezones, rules should be interpreted as minutes since local midnight in `Gym.timezone` (not server timezone). Migration path: create default gym w/ LA timezone and assign all existing fighters to it, preserving semantics for existing rules. [VERIFIED: codebase `backend/prisma/schema.prisma`]

For maps links: safest approach is store structured address + optional lat/lng and generate Google/Apple Maps URLs server-side or client-side using URL encoding; avoid persisting arbitrary URLs (prevents `javascript:` / open-redirect style injection vectors). Use official Google Maps “Maps URLs” search format and Apple Maps “map links” query parameter with URL-encoded query string. [CITED: https://developers.google.com/maps/documentation/urls/get-started][CITED: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html]

**Primary recommendation:** add `Gym` model (with `timezone` IANA string) + `Fighter.gymId`, backfill default gym, then replace `AVAILABILITY_TIMEZONE` usage with resolved `gymTimezone` in availability + schedule regeneration + admin bookings filtering; return `timezone` explicitly in DTOs and group days by gym-local date.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persist `Gym` + `Fighter.gymId` | Database/Storage | API/Backend | Prisma schema + migrations define truth; backend enforces relation. [VERIFIED: codebase `backend/prisma/schema.prisma`] |
| Slot generation “day boundaries” in gym timezone | API/Backend | Database/Storage | Local day boundary math belongs in backend; DB stores UTC instants. [VERIFIED: codebase `backend/src/availability/availability.service.ts`] |
| Booking timestamps stored unambiguously | Database/Storage | API/Backend | Already `DateTime` fields in UTC; keep. [VERIFIED: codebase `backend/prisma/schema.prisma`] |
| Availability response timezone + grouping | API/Backend | Client | Backend currently groups by ISO date in `AVAILABILITY_TIMEZONE` and returns `timezone`. Shift to gym timezone so client doesn’t guess. [VERIFIED: codebase `backend/src/availability/availability.service.ts`] |
| “Show on map” link building + safe encoding | Client | API/Backend | UI triggers action; link format should be canonical + encoded; avoid stored raw URLs. [CITED: https://developers.google.com/maps/documentation/urls/get-started][CITED: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `luxon` | 3.7.2 | timezone-safe parsing, zone conversion, day boundaries, DST rules | Already used in availability + booking flows; supports IANA zones + `setZone` + `toUTC`. [VERIFIED: npm registry `npm view luxon version`][VERIFIED: codebase `backend/src/availability/availability.service.ts`] |
| Prisma | (existing) | schema + migrations + query layer | Project already uses Prisma models for fighter/slots/bookings. [VERIFIED: codebase `backend/prisma/schema.prisma`] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-validator` | (existing) | validate DTO inputs (`fromDate` format etc) | Validate timezone string and date-only inputs. [VERIFIED: codebase `backend/src/availability/dto/availability-query.dto.ts`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Luxon timezone math | JS `Date` + manual offset math | DST/ambiguous time bugs; hard to reason about; already Luxon dependency. [VERIFIED: codebase uses Luxon] |

## Architecture Patterns

### System Architecture Diagram

```text
Client (calendar / fighter profile)
  |
  | availability query: fighterId, serviceId, fromDate(YYYY-MM-DD), days
  v
API: AvailabilityService
  |
  | resolve fighter -> gym -> gym.timezone (IANA)
  | parse fromDate as "gym-local date" boundary
  | generate local candidate slots using schedule rules (minutes since local midnight)
  | convert local starts/ends -> UTC instants
  v
DB (Prisma/Postgres)
  - Gym(timezone, address...)
  - Fighter(gymId)
  - FighterScheduleRule(dayOfWeek, startMinute, endMinute) interpreted in Gym.timezone
  - Slot(startsAtUtc, endsAtUtc)
  - Booking(expiresAtUtc, slotId...)
  |
  v
API response
  - timezone: gym.timezone
  - days[] grouped by gym-local ISO date
  - slots[] with UTC instants (and optionally local-formatted fields if chosen)
```

### Recommended Project Structure (backend additions)

```text
backend/src/
  gyms/
    gyms.module.ts
    gyms.service.ts           # CRUD + tz validation helpers
    dto/
  fighters/
    fighters.service.ts       # resolve fighter -> gym
  availability/
    availability.service.ts   # accept timezone per fighter/gym, no global constant
backend/prisma/schema.prisma  # Gym model + relations
```

### Pattern 1: “Local date input” parsed in target zone

**What:** treat `YYYY-MM-DD` input as date in gym timezone, not server local and not UTC; apply `.startOf('day')` in that zone; convert to UTC for DB range filters.  
**When to use:** availability ranges, admin “from/to” filters, any day-based UI.  
**Example:**

```typescript
// Source: Luxon docs (DateTime.fromISO zone option, setZone/toUTC) [CITED]
const startLocal = DateTime.fromISO(fromDate, { zone: gymTimezone }).startOf('day');
const startUtc = startLocal.toUTC();
```

[CITED: https://moment.github.io/luxon/api-docs/index.html]

### Pattern 2: Group UTC instants by gym-local day boundary

**What:** for each `startsAtUtc`, compute gym-local ISO date via `.setZone(gymTz).toISODate()` and bucket by date string.  
**When to use:** `days[]` response shape and month/day grouping.  
**Example:**

```typescript
// Source: Luxon zones docs [CITED]
const localDate = DateTime.fromJSDate(slot.startsAtUtc, { zone: 'utc' })
  .setZone(gymTimezone)
  .toISODate();
```

[CITED: https://github.com/moment/luxon/blob/master/docs/zones.md]

### Anti-Patterns to Avoid

- **Hardcoded global timezone constant:** blocks multi-gym support and silently mis-groups slots. [VERIFIED: codebase `AVAILABILITY_TIMEZONE` constant exists]
- **Interpreting `YYYY-MM-DD` as UTC midnight:** breaks “day” for gyms west/east of UTC, especially around DST transitions. [ASSUMED common bug]
- **Persisting arbitrary map URLs from user input:** risks `javascript:`/open-redirect style issues; store address + generate canonical URLs instead. [ASSUMED best practice]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timezone offsets/DST math | manual “-07:00/-08:00” logic | Luxon + IANA zone | DST changes + ambiguous times handled by library + tzdb rules. [CITED: https://github.com/moment/luxon/blob/master/docs/zones.md][CITED: https://www.iana.org/time-zones] |
| Map query encoding | string concatenation | `URL` + `URLSearchParams` (or `encodeURIComponent`) | Prevents broken links + injection via special chars. [ASSUMED best practice] |

## Codebase Findings (timezone assumptions)

- Global constant `AVAILABILITY_TIMEZONE='America/Los_Angeles'`. [VERIFIED: codebase `backend/src/availability/availability.constants.ts`]
- Availability:
  - Parses `fromDate` using `AVAILABILITY_TIMEZONE`.
  - Generates candidate local slots in `AVAILABILITY_TIMEZONE` then stores instants in UTC.
  - Buckets slot days by converting UTC instant to `AVAILABILITY_TIMEZONE`. [VERIFIED: codebase `backend/src/availability/availability.service.ts`]
- Admin schedule regen uses `AVAILABILITY_TIMEZONE` for “startLocal today” and regen window. [VERIFIED: codebase `backend/src/admin/schedule.admin.service.ts`]
- Admin bookings filters parse `from/to` date-only inputs in `AVAILABILITY_TIMEZONE` (affects list boundaries). [VERIFIED: codebase `backend/src/admin/bookings.admin.service.ts`]
- Prisma schema comment bakes in LA timezone for schedule rule minutes. [VERIFIED: codebase `backend/prisma/schema.prisma` lines near `FighterScheduleRule.startMinute/endMinute`]

## Canonical Data Model: `Gym`

**Best place:** Prisma schema `backend/prisma/schema.prisma` owns domain shape + migrations. [VERIFIED: codebase]

### Proposed `Gym` fields (canonical)

- **Identity**
  - `id` (cuid)
  - `name` (string)
- **Address** (structured; supports formatting + search)
  - `addressLine1` (string)
  - `addressLine2` (string?, optional)
  - `city` (string)
  - `state` (string, 2-letter US state) [ASSUMED US-only for now]
  - `postalCode` (string)
  - `countryCode` (string, default `US`) [ASSUMED]
- **Timezone**
  - `timezone` (string; IANA tzdb name, e.g. `America/Los_Angeles`) [CITED: https://www.iana.org/time-zones]
  - Server-side validation: reject unknown zone names (Luxon `IANAZone.isValidZone(...)` or equivalent) [ASSUMED exact API; must verify against Luxon docs in implementation]
- **Geo (optional, future)**
  - `lat` (float?, optional)
  - `lng` (float?, optional)

### Relations

- `Gym` 1 → many `Fighter` (now each fighter belongs to exactly 1 gym). [VERIFIED: requirement in CONTEXT.md]
- Add `Fighter.gymId` (required) + relation.

### Migration strategy (locked)

- Create default gym row (name “Default Gym” or config-driven), with timezone `America/Los_Angeles`.
- Backfill all existing fighters `gymId = defaultGym.id`. [VERIFIED: locked decision in CONTEXT.md]

## Timezone Policy (implementation-level)

### Storage

- **DB always stores instants**: keep `Slot.startsAtUtc/endsAtUtc`, `Booking.expiresAtUtc`, `Slot.reservedUntilUtc` as UTC instants (Postgres `timestamptz` via Prisma `DateTime`). [VERIFIED: codebase `backend/prisma/schema.prisma`]

### Computation (gym-local boundaries)

- **Day boundary:** for any “date-only” concept (`fromDate`, calendar grouping), interpret date in `Gym.timezone` and convert to UTC range for DB querying.
- **Slot generation:** interpret `FighterScheduleRule.startMinute/endMinute` as minutes since 00:00 **in gym timezone** for the given local day. Then create local DateTime in gym timezone and `.toUTC()` for persistence.
- **Admin date filters:** either (a) require gymId/timezone parameter for admin date filtering, or (b) document that admin filters are in gym timezone per selected fighter/gym; current global LA assumption must be removed for correctness. [ASSUMED product choice; needs plan decision]

### DTO policy (backend → frontend)

Minimum contract to prevent UI guessing:

- Return `timezone: gym.timezone` in availability + booking DTOs where UI displays times. [VERIFIED: availability already returns timezone field]
- Continue returning UTC instants (`startsAtUtc`, `endsAtUtc`) as ISO strings; UI formats using provided timezone (Luxon/Intl). [ASSUMED frontend choice]

Optional “belt and suspenders”:

- Also return `startsAtLocal`, `endsAtLocal` as ISO strings with offset in gym timezone for display-only, to reduce UI timezone logic. [ASSUMED; implement only if UI wants]

## Common Pitfalls

### Pitfall: DST “missing hour” causes no-slot day gaps
**What goes wrong:** local times like 02:30 don’t exist on spring-forward day; naive loops may create invalid DateTimes or shift unexpectedly.  
**How to avoid:** generate from local day start in zone and advance using Luxon; validate `DateTime.isValid` if constructing specific local wall times. [ASSUMED; verify during implementation]

### Pitfall: Ambiguous local times on fall-back day
**What goes wrong:** 01:30 occurs twice; without disambiguation, schedule could map to wrong UTC instant.  
**How to avoid:** rely on Luxon’s zone rules; when parsing ambiguous local times, decide policy (earlier/later offset) and document. [ASSUMED; policy decision needed if schedules include 1am windows]

### Pitfall: `YYYY-MM-DD` treated as UTC instead of gym-local
**What goes wrong:** day grouping shifts by 1 day for gyms behind/ahead of UTC.  
**How to avoid:** always parse date-only in `Gym.timezone`, then `startOf('day')`, then convert to UTC. [VERIFIED: code currently parses in fixed LA zone]

### Pitfall: Map link injection / broken encoding
**What goes wrong:** address with `&`, `?`, `#` breaks query; storing full URL allows malicious scheme.  
**How to avoid:** generate canonical URL using official formats and URL-encode query string; do not store arbitrary URL strings. [CITED: https://developers.google.com/maps/documentation/urls/get-started][CITED: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html]

## Environment Availability

Step 2.6: SKIPPED (no new external services; uses existing Postgres + Prisma + Luxon already in repo). [ASSUMED]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend framework | Karma + Jasmine (Angular CLI) [VERIFIED: Phase 11 validation doc] |
| Backend framework | Jest (NestJS) [VERIFIED: Phase 11 validation doc] |
| Quick run (frontend) | `npm test` [VERIFIED: `.planning/phases/11-gyms-multi-timezone/11-VALIDATION.md`] |
| Quick run (backend) | `cd backend && npm test` [VERIFIED: `.planning/phases/11-gyms-multi-timezone/11-VALIDATION.md`] |

### Phase Requirements → Test Map (R7)

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|------|
| R7 | `Gym` schema exists; fighter → gym relation stored; timezone validated | unit | `cd backend && npm test` | Add unit tests for timezone validation + default gym backfill behavior (service-level). [ASSUMED exact test placement] |
| R7 | Slot generation + day grouping uses gym tz boundaries (NY vs LA) | unit/integration | `cd backend && npm test` | Add tests that same UTC instant buckets to different local dates per gym tz; and schedule window generates correct UTC instants around DST boundary. [ASSUMED] |
| R7 | UI renders gym address + safe map link (encoded) | unit | `npm test` | Add map-link builder tests: encodes address, no scheme injection. [ASSUMED] |

### Wave 0 Gaps (from `11-VALIDATION.md`)

- [ ] Add backend timezone math spec(s) (gym tz → UTC instants; day boundary grouping). [VERIFIED: `.planning/phases/11-gyms-multi-timezone/11-VALIDATION.md`]
- [ ] Add backend DTO contract spec(s) for returning tz + formatted times (if chosen). [VERIFIED: `.planning/phases/11-gyms-multi-timezone/11-VALIDATION.md`]
- [ ] Add frontend map-link render spec (no injection; correct URL encoding). [VERIFIED: `.planning/phases/11-gyms-multi-timezone/11-VALIDATION.md`]

## Security Domain

### Applicable ASVS Categories (Level 1)

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V4 Access Control | low | Gym data shown publicly; admin mutations still guarded. [ASSUMED] |
| V5 Input Validation | yes | Validate `Gym.timezone` as IANA zone; validate address fields length/charset; validate `fromDate` format (already). [VERIFIED: `fromDate` regex exists; timezone validation new] |
| V8 Data Protection | low | Address data non-secret but should avoid leaking internal IDs via map links. [ASSUMED] |

### Known Threat Patterns (phase-specific)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Map link injection via stored URL | Tampering | Store address components; generate URLs using encoding; never allow arbitrary scheme. [ASSUMED best practice][CITED: https://developers.google.com/maps/documentation/urls/get-started] |
| Incorrect timezone leading to wrong booking time display | Tampering/Repudiation | Server returns gym timezone + UTC instants; tests cover NY/LA and DST boundary. [ASSUMED] |

## Sources

### Primary (HIGH confidence)
- Luxon API docs (DateTime `fromISO`, `setZone`, `toUTC`): [CITED: https://moment.github.io/luxon/api-docs/index.html]
- Luxon zones guide (IANA zones + zone behavior): [CITED: https://github.com/moment/luxon/blob/master/docs/zones.md]
- IANA Time Zone Database (tzdb): [CITED: https://www.iana.org/time-zones]
- Google Maps “Maps URLs” (search URL format `https://www.google.com/maps/search/?api=1&query=...`): [CITED: https://developers.google.com/maps/documentation/urls/get-started]
- Apple Maps “Map Links” (`http://maps.apple.com/?q=...`): [CITED: https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html]

### Codebase (VERIFIED)
- Prisma models: `Fighter`, `FighterScheduleRule`, `Slot`, `Booking` [VERIFIED: codebase `backend/prisma/schema.prisma`]
- Hardcoded timezone assumption: `AVAILABILITY_TIMEZONE='America/Los_Angeles'` [VERIFIED: codebase `backend/src/availability/availability.constants.ts`]
- Availability generation + grouping uses `AVAILABILITY_TIMEZONE` [VERIFIED: codebase `backend/src/availability/availability.service.ts`]
- Admin date filtering uses `AVAILABILITY_TIMEZONE` [VERIFIED: codebase `backend/src/admin/bookings.admin.service.ts`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `FighterScheduleRule.startMinute/endMinute` should be interpreted in `Gym.timezone` (not user timezone) | Timezone Policy | If wrong, schedules shift when fighter moves gyms; would require per-rule timezone or per-fighter override. |
| A2 | Backend should validate IANA timezone string via Luxon zone validation helper | Data Model / Security | If Luxon API differs, need alternate validation (Intl, tzdb list, or trial parse). |
| A3 | Admin bookings “from/to” filters should become gym-aware (or require specifying which timezone) | Timezone Policy | If ignored, admin reports inconsistent for non-LA gyms. |
| A4 | Map link should be generated from address fields, not stored raw | Maps | If product needs custom links, must sanitize/allowlist scheme/host. |

## Open Questions (RESOLVED)

1. **Admin endpoints timezone semantics — RESOLVED**
   - Contract: date-only admin filters (`from/to` style) MUST be scoped by `fighterId` or `gymId`.
   - Parsing: interpret `YYYY-MM-DD` as local date in that gym timezone (`Gym.timezone`), then convert to UTC range for DB queries.
   - If no scope provided: reject request (preferred) or treat as UTC explicitly with clearly named params (do not silently use any default zone).

2. **DTO “local time” fields — RESOLVED**
   - Contract: backend returns UTC instants + explicit `timezone` only (no preformatted local fields in Phase 11).
   - Frontend formats for display using provided timezone (prevents UI guessing while keeping single source of truth).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Luxon + Prisma usage verified; Luxon version verified on npm.
- Architecture: MEDIUM — gym-aware derivation straightforward, but admin timezone semantics and DTO formatting choice still open.
- Pitfalls: MEDIUM — DST/ambiguity behaviors real, but exact Luxon handling details to verify in implementation tests.

**Research date:** 2026-04-26  
**Valid until:** 2026-05-26

