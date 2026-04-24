# Phase 2: Catalog & fighter profile - Research

**Researched:** 2026-04-24  
**Domain:** Public catalog + fighter profile (NestJS + Prisma/Postgres + Ionic/Angular)  
**Confidence:** MEDIUM

## User Constraints (from CONTEXT.md)

### Implementation Decisions

#### Catalog (Explore fighters)

- **D-01:** Fighter cards show **price as “From $X”** (minimum bookable service price for the fighter), not “hourly” and not a single featured-service price.
- **D-02:** Discipline chips / filter UI exists as **static UI only** in Phase 2 (no actual filtering behavior yet).
- **D-03:** Bookmark / saved-fighter action is **out of scope** for Phase 2.

#### Fighter profile

- **D-04:** Service selection behavior:
  - Tapping a service row **selects exactly one service and immediately navigates** to the next step (Phase 2 placeholder route is acceptable).
  - A footer CTA exists but is **disabled/hidden until a service is selected**; after selection it becomes available (primarily useful for accessibility and clear primary action).
- **D-05:** Fighter profile **stats are required in Phase 2** (displayed similarly to the design reference). The API/model must carry these fields (or a structured equivalent) so the UI can render them without hardcoding.

#### UI stack alignment

- **D-06:** Implement the UI using **Ionic/Angular components and styling** (do not adopt Tailwind for the Angular app to match the HTML design references).

#### Carry-forward constraints from Phase 1 (must remain compatible)

- **D-07:** Auth/session model remains cookie-based (httpOnly refresh strategy). Phase 2 public catalog/profile should not depend on login; booking flow entry can remain compatible with Phase 3 auth requirements.
- **D-08:** Maintain iOS/Capacitor friendliness (avoid approaches that break in WKWebView; keep navigation/state robust across refresh/deep-link).

#### Claude's Discretion

- Exact catalog card layout density (featured card vs uniform cards) as long as it follows the canonical design references.
- Whether the placeholder booking route is a dedicated page or reuses an existing shell; exact route naming as long as it encodes fighterId + serviceId.
- Empty/loading/error state visuals (must follow DESIGN.md “no-line” rule).

### Deferred Ideas (OUT OF SCOPE)

- Saved fighters / bookmarking — explicitly deferred (out of Phase 2 scope).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-01 | User can browse a list of fighters with name, photo, and short summary | Public `GET /fighters` API returning published fighters with `fromPrice` (min service price) and summary fields; Ionic catalog page with loading/error states. |
| CAT-02 | User can open a fighter profile from the catalog | Public `GET /fighters/:id` API returning profile + stats + services; Ionic detail route takes `fighterId`. |
| CAT-03 | Catalog data is loaded from the backend (not hardcoded only in the client) | API client/service layer in Angular using existing HttpClient patterns; avoid embedding fighter data in UI. |
| FTR-01 | User can view fighter profile information (bio, disciplines, media as available) | Fighter model includes bio, discipline list (or string list), and media URLs; profile API returns these. |
| FTR-02 | User can view all bookable services for that fighter with duration, modality (online/offline), and price | Service model with `durationMinutes`, `modality`, `priceCents`, `currency`; API returns sorted services for a fighter. |
| FTR-03 | User can select exactly one service before choosing a time | UI service row tap navigates immediately with `fighterId + serviceId`; placeholder next-step route stores the selection. |

## Summary

Phase 2 is primarily a **public read model**: published fighters and their services must be readable without auth, and the UI must show a catalog + profile that matches the design contract. The key implementation detail is **D-01 “From $X”** which requires a reliable min-price computation from related services (not a hardcoded field), and **D-05 stats** which requires the fighter model to carry structured values the UI can render.

The current backend baseline is NestJS 11 with Prisma and a Postgres datasource. It uses `prisma db push` (no `prisma/migrations/` present) and a global `ValidationPipe` with whitelisting + `forbidNonWhitelisted`. The Angular/Ionic app uses standalone pages and a cookie-based auth interceptor; Phase 2 routes must be **public** (no `authGuard`) and should not depend on session state.

**Primary recommendation:** Model `Fighter` + `Service` in Prisma with `published` flags, price stored as integer cents, and implement public `GET /fighters` + `GET /fighters/:id` endpoints that compute `fromPrice` from services on the server.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Public fighters catalog read API | API / Backend | Database / Storage | Source of truth; needs published filtering and min-price computation server-side. |
| Fighter profile data (bio, media, stats, disciplines) | API / Backend | Database / Storage | Prevent UI hardcoding; supports future admin and slots/booking. |
| “From $X” (min service price) | API / Backend | Database / Storage | Deterministic computation and consistent formatting across clients; avoid duplicating logic in UI. |
| Catalog list UI and profile UI | Browser / Client | — | Pure presentation + navigation; must follow Ionic/Angular constraints. |
| Service selection navigation payload | Browser / Client | API / Backend | UI decides selection; backend needs stable `serviceId` for downstream phases. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS (`@nestjs/common`, `@nestjs/core`) | 11.x (repo uses `^11.0.0`; latest `11.1.19`) [VERIFIED: npm registry] | Backend API framework | Already baseline in Phase 1; DI/modules/controllers patterns in repo. |
| Prisma (`prisma`, `@prisma/client`) | 6.x (repo uses `^6.0.0`; latest `7.8.0`) [VERIFIED: npm registry] | ORM + schema | Already baseline; Phase 2 adds new models and queries. |
| PostgreSQL | via `DATABASE_URL` [VERIFIED: repo prisma schema] | Persistence | Authoritative store for catalog/profile domain. |
| Ionic (`@ionic/angular`) + Angular | Ionic 8 + Angular 20 (repo uses `^20.0.0`; Angular latest `21.2.10`) [VERIFIED: npm registry + repo package.json] | Client UI | Locked by D-06 and existing shell. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-validator` + `class-transformer` | present in backend deps [VERIFIED: repo package.json] | DTO validation | All public endpoints should validate path/query params and shape outputs consistently. |
| `cookie-parser` | present; used in `main.ts` [VERIFIED: repo] | Cookie parsing | Keep auth compatibility (Phase 1). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma | Drizzle/TypeORM | Out of scope; Prisma already integrated and used by auth/users. |
| Public read computed `fromPrice` | Denormalized field on Fighter | Denormalization introduces consistency risks and needs additional update logic; compute via query until performance demands otherwise. |

## Architecture Patterns

### System Architecture Diagram

```text
Browser (Ionic/Angular)
  ├─ GET /fighters  ───────────────────────────────┐
  └─ GET /fighters/:id ────────────────────────────┤
                                                   v
API (NestJS)
  ├─ FightersController (public)
  │    ├─ FightersService
  │    │    ├─ Prisma query: published fighters
  │    │    ├─ Compute fromPrice = min(service.priceCents)
  │    │    └─ Map to DTO/view model (no internal fields)
  │    └─ Response: list/detail models for UI
  │
  └─ (Auth endpoints remain separate; not required for public catalog)
                                                   v
Database (Postgres via Prisma)
  ├─ Fighter (published, profile fields, stats)
  └─ Service (fighterId, duration, modality, priceCents, published)
```

### Recommended Project Structure (incremental)

Backend (Nest):
```
backend/src/
├── fighters/
│   ├── fighters.module.ts
│   ├── fighters.controller.ts      # public read endpoints only
│   ├── fighters.service.ts         # Prisma queries + mapping
│   └── dto/
│       ├── fighter-list-item.dto.ts
│       └── fighter-profile.dto.ts
└── prisma/
    └── prisma.service.ts
```

Frontend (Angular/Ionic):
```
src/app/
├── pages/
│   ├── catalog/                    # new public page
│   ├── fighter-profile/            # new public page
│   └── book-placeholder/           # new placeholder page (Phase 2)
└── core/
    ├── services/
    │   └── catalog.service.ts      # HttpClient wrappers (public calls)
    └── models/
        └── catalog.models.ts       # shared API response types
```

### Pattern 1: Public read endpoints with explicit view models

**What:** Keep DB schema types private; return explicit DTOs for catalog/profile responses.  
**When to use:** All public catalog/profile APIs (prevents accidental leakage of internal fields and stabilizes client contract).  
**Example:** Use Nest controllers + services with Prisma queries and map to DTOs. [VERIFIED: repo patterns in `users/*` + Nest module layout]

### Pattern 2: Min-price (“From $X”) computed server-side

**What:** Compute `fromPriceCents` as the minimum of published services’ `priceCents` per fighter.  
**When to use:** Catalog list card price display (D-01).  
**How:** Either:
- query fighters with their services and compute in JS (simple; more data transfer), or
- use Prisma aggregation/grouping and join results to fighters (more efficient; two-step query).

Prisma supports `_min` in aggregations/groupBy. [CITED: https://docs.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing]

### Anti-Patterns to Avoid

- **Hardcoding “From $X” in the client**: drifts from backend truth and will break when services change.  
- **Exposing raw Prisma models**: easy to leak unpublished fields or internal IDs unintentionally.  
- **Marking catalog routes as guarded**: violates “public catalog/profile should not require auth” and complicates SEO/deep-linking.

## Data Model & API Contract (planning-critical)

### Proposed Prisma models (additive)

Add at minimum:
- `Fighter`: identity + published flag + catalog card fields + profile fields + required “stats” (D-05).
- `Service`: belongs to `Fighter`; published flag; duration; modality; price.

**Price storage:** `priceCents` as integer + `currency` string (e.g. `"USD"`). [ASSUMED best practice; confirm currency scope for v1]

**Stats (D-05):** store explicit scalar fields (e.g. `wins`, `losses`, `draws`, `yearsPro`, `rating`, etc.) or a structured JSON column if flexibility is required. Prefer scalar fields for queryability and type safety unless the stats set is expected to change frequently. [ASSUMED]

### Public APIs (minimum viable set)

1) `GET /fighters`
- **Auth:** none
- **Returns:** list of published fighters with:
  - `id`, `name`, `photoUrl`, `summary`
  - `fromPriceCents` (min published service price)
  - optional `disciplines` (for static chips UI)

2) `GET /fighters/:fighterId`
- **Auth:** none
- **Returns:** published fighter profile with:
  - profile fields: `bio`, `disciplines`, `media` (urls), `photoUrl`
  - **stats** for D-05
  - `services[]`: published services with `id`, `title`, `durationMinutes`, `modality`, `priceCents`, `currency`

**Published rules:** Only return fighters/services where `published = true`. If unpublished or missing, return 404 (not 403) to avoid leaking existence. [ASSUMED; common public API practice]

### DB change management (migrations vs push)

Repo currently has Prisma schema but **no `prisma/migrations/` directory** and scripts include `prisma:push` (`prisma db push`). [VERIFIED: repo]  
Planning should decide one of:
- continue using `db push` for Phase 2 (fast for dev; no migration history), or
- introduce `prisma migrate` workflow (more production-ready; adds migration files and commands).

Given Phase 1 already shipped without migrations, Phase 2 should likely **stay consistent** unless Phase 2 explicitly targets production deploy readiness. [ASSUMED]

### Seed strategy

Add a seed script that inserts a small set of published fighters + services (enough to drive UI). Prisma provides `prisma db seed` for running a configured seed command. [CITED: https://www.prisma.io/docs/guides/database/seed-database]  
Use **idempotent upserts** (seed safe to run repeatedly) and seed in dependency order (fighters → services). [ASSUMED best practice]

## Frontend Integration Patterns (Ionic/Angular)

### Routing (public)

Current routes show only auth/profile routes, with `profile` guarded. [VERIFIED: `src/app/app.routes.ts`]  
Phase 2 should add public routes:
- `/fighters` (catalog page)
- `/fighters/:fighterId` (profile page)
- `/book/:fighterId/:serviceId` (placeholder route for Phase 2; feeds Phase 3)

### API calling patterns

Phase 1 uses `HttpClient` + `withCredentials: true` for auth endpoints and `AuthService.loadProfile()`. [VERIFIED: `auth.service.ts`]  
For public endpoints:
- Prefer **no credentials** unless the endpoint needs cookies.
- Keep base URL via `environment.apiUrl` which is `/api` in development (proxy). [VERIFIED: `environment.development.ts` + `proxy.conf.json`]

### UI pitfalls (Ionic + Design contract)

- **“No-line” rule**: avoid dividers/borders; use tonal layering per `DESIGN.md`. [VERIFIED: DESIGN.md]
- **Static discipline chips**: UI can show chips but must not filter results yet (D-02). Ensure chips are not wired to query params in Phase 2 plan.
- **Service selection**: tap row navigates immediately (D-04) and ensure there is also an accessible CTA path (footer CTA appears/enables after selection).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password/session/auth | Custom auth scheme | Existing Phase 1 auth modules | Phase 2 is public; keep auth unchanged to avoid regressions. |
| Money arithmetic/formatting | Floating point dollars | Integer `priceCents` + formatting at edges | Prevent rounding bugs and sorting issues. [ASSUMED] |
| DTO validation | Manual input parsing | `class-validator` + Nest `ValidationPipe` | Pipe already configured globally with whitelist + forbid. [VERIFIED: `backend/src/main.ts`] |

## Common Pitfalls

### Pitfall 1: Incorrect “From $X” when services are unpublished
**What goes wrong:** min-price includes hidden/unpublished services, showing a lower “From” than actually bookable.  
**Why it happens:** forgetting to filter by `published = true` in the min-price computation.  
**How to avoid:** compute min only across bookable services and return `null` (or omit) when no bookable services exist.  
**Warning signs:** catalog shows “From $0” or “From $X” but profile lists no services.

### Pitfall 2: N+1 queries for catalog list
**What goes wrong:** list endpoint queries services per fighter, degrading performance.  
**Why it happens:** naïve implementation computes min-price with a per-fighter query.  
**How to avoid:** use one query that includes services (then compute in memory) or a two-step aggregate/groupBy query. Prisma documents aggregation/groupBy. [CITED: https://docs.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing]  
**Warning signs:** many DB queries on a single `/fighters` call.

### Pitfall 3: Client accidentally blocked by CORS/credentials mismatches
**What goes wrong:** public endpoints fail in browser because requests carry cookies or origin not allowed.  
**Why it happens:** `withCredentials` defaults/usage differences; CORS must allow credentials and origins.  
**How to avoid:** keep public GETs without credentials; keep dev via proxy (`/api`) so same-origin.  
**Warning signs:** browser console shows CORS errors only for some requests.

### Pitfall 4: Stats hardcoded in UI
**What goes wrong:** UI shows placeholder stats that never match real data.  
**Why it happens:** not modeling stats in DB and API (D-05).  
**How to avoid:** define explicit fields (or structured stats object) in the fighter API contract and seed realistic values.

## Environment Availability

Step 2.6: SKIPPED (no new external services required beyond existing Node/Postgres dev setup). [ASSUMED — execution phase should still verify local Postgres availability]

## Validation Architecture

Nyquist validation is **enabled** in `.planning/config.json` (`workflow.nyquist_validation: true`). [VERIFIED: repo]

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | Jest + `@nestjs/testing` + Supertest (recommended) [CITED: https://docs.nestjs.com/fundamentals/testing] |
| Backend config file | none currently — needs Wave 0 setup [VERIFIED: no `backend/test/` or Jest config found] |
| Frontend framework | Karma + Jasmine (`ng test`) [VERIFIED: root `package.json` + `angular.json`] |
| Quick run command | Backend: `npm run test:e2e` (to add) / Frontend: `npm test -- --watch=false` (or `ng test --watch=false`) |
| Full suite command | Frontend: `npm test` (watch in dev) + Backend e2e suite |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | `GET /fighters` returns published fighters with `fromPriceCents` computed from published services | e2e | `cd backend && npm run test:e2e` | ❌ Wave 0 |
| CAT-02 | `GET /fighters/:id` returns profile + services; 404 for unpublished | e2e | `cd backend && npm run test:e2e` | ❌ Wave 0 |
| CAT-03 | Catalog UI loads data from API and renders loading/error states | unit | `npm test -- --watch=false` | ✅ (test infra exists; new tests needed) |
| FTR-01 | Profile UI renders bio/disciplines/media from API | unit | `npm test -- --watch=false` | ✅ (infra exists; new tests needed) |
| FTR-02 | Services list renders duration/modality/price; selecting row triggers navigation | unit | `npm test -- --watch=false` | ✅ (infra exists; new tests needed) |
| FTR-03 | Exactly one service selection drives placeholder route with correct ids | unit | `npm test -- --watch=false` | ✅ (infra exists; new tests needed) |

### Sampling Rate

- **Per task commit:** frontend unit tests affected by change (`npm test -- --watch=false`), plus backend e2e once backend endpoints change.  
- **Per wave merge:** run frontend unit tests + backend e2e suite green.  
- **Phase gate:** backend public read endpoints validated via e2e; UI pages validated via unit tests + manual smoke (ionic navigation + deep-link).

### Wave 0 Gaps

- [ ] `backend/` add Jest config + scripts (`test`, `test:e2e`) + devDeps (`jest`, `ts-jest`, `@nestjs/testing`, `supertest`, `@types/supertest`) [CITED: https://docs.nestjs.com/fundamentals/testing]  
- [ ] `backend/test/` create e2e tests for `/fighters` and `/fighters/:id` including published filtering and fromPrice computation.  
- [ ] Add test DB strategy: separate `DATABASE_URL_TEST` or ephemeral schema; ensure seeding/cleanup per test run. [ASSUMED]  
- [ ] Frontend: add focused unit tests for new catalog/profile components and service selection navigation.

## Security Domain

Security enforcement is **enabled** in `.planning/config.json` (`workflow.security_enforcement: true`, ASVS level 1). [VERIFIED: repo]

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no (public read endpoints) | Keep existing auth for protected endpoints; do not regress cookie/session flow. |
| V3 Session Management | no (public read endpoints) | N/A for Phase 2; ensure endpoints do not require cookies. |
| V4 Access Control | yes | Enforce `published = true` and avoid leaking unpublished records (404). [ASSUMED] |
| V5 Input Validation | yes | Use DTO validation + Nest `ValidationPipe` (whitelist + forbid). [VERIFIED: backend `main.ts`] |
| V6 Cryptography | no (phase scope) | N/A |

### Known Threat Patterns for this phase

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Data exposure of unpublished fighters/services | Information Disclosure | Filter on `published`, return stable public DTOs, avoid raw model exposure. |
| Enumeration of IDs | Information Disclosure | Use non-guessable IDs (current Prisma uses `cuid()` for users). Consider same for fighters/services. [ASSUMED] |

## Sources

### Primary (HIGH confidence)

- Prisma aggregation/groupBy docs (min/max/etc): `https://docs.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing`  
- Prisma seed guide (`prisma db seed`): `https://www.prisma.io/docs/guides/database/seed-database`  
- NestJS testing docs (`@nestjs/testing`, Supertest patterns): `https://docs.nestjs.com/fundamentals/testing`

### Secondary (MEDIUM confidence)

- Repo evidence: NestJS modules/controllers, Prisma schema, Angular routes, proxy config, and global validation pipe (files cited above). [VERIFIED: repo]

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM — npm latest versions verified, but project will likely remain on current pinned major versions during Phase 2.  
- Architecture: HIGH — repo patterns and phase scope are straightforward public read model + UI pages.  
- Pitfalls: MEDIUM — common issues identified; performance characteristics depend on dataset size and chosen query strategy.

**Research date:** 2026-04-24  
**Valid until:** 2026-05-24

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Store money as `priceCents` integer + `currency` | Data Model & API Contract | If pricing must support decimals/FX now, schema may need `Decimal` and currency rules. |
| A2 | Stats should be scalar fields unless frequent schema drift expected | Data Model & API Contract | If stats are highly variable, scalar approach becomes migration-heavy. |
| A3 | Use 404 for unpublished fighters/services | Public APIs | If product wants “coming soon” or admin preview, behavior changes. |
| A4 | Stay on `prisma db push` workflow for Phase 2 | DB change management | If production migration history is required now, Phase 2 scope expands to migration tooling. |
| A5 | Execution can rely on existing Postgres dev setup | Environment Availability | If Postgres is missing, execution needs install/container steps. |

## Open Questions

1. **What exact stats fields are required for D-05?**
   - What we know: UI needs “stats tiles” rendered from API/model; hardcoding is forbidden.
   - What's unclear: exact stat set (wins/losses, rank, gym, years pro, etc.).
   - Recommendation: define a minimal fixed set aligned with the `src/design/fighter_profile/code.html` reference, then seed realistic values.

2. **Currency and locale scope for v1**
   - What we know: UI needs “From $X”.
   - What's unclear: always USD vs multi-currency, formatting rules.
   - Recommendation: lock v1 to USD formatting; store `currency` anyway for forward compatibility. [ASSUMED]

3. **Migrations policy**
   - What we know: repo uses Prisma schema and `db push`; no migrations folder.
   - What's unclear: whether Phase 2 should introduce `prisma migrate` now.
   - Recommendation: planner should add a decision task early (Wave 0) and keep Phase 2 consistent with Phase 1 unless production deployment requirements have changed.

## RESEARCH COMPLETE

