# Phase 2: Catalog & fighter profile - Context

**Gathered:** 2026-04-24  
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the public-facing **fighters catalog** and **fighter profile** experience backed by the API:
- Catalog lists all **published fighters** with image + summary (CAT-01, CAT-03).
- Tapping a fighter opens a **profile** with bio + **structured services** (duration, modality, price) (CAT-02, FTR-01, FTR-02).
- User must be able to **select exactly one service** and then advance toward scheduling via a **placeholder route** (Phase 3 implements slots) (FTR-03).

Out of scope: real slot availability, booking creation, payments, admin CRUD, favorites/bookmarks persistence.
</domain>

<decisions>
## Implementation Decisions

### Catalog (Explore fighters)

- **D-01:** Fighter cards show **price as “From $X”** (minimum bookable service price for the fighter), not “hourly” and not a single featured-service price.
- **D-02:** Discipline chips / filter UI exists as **static UI only** in Phase 2 (no actual filtering behavior yet).
- **D-03:** Bookmark / saved-fighter action is **out of scope** for Phase 2.

### Fighter profile

- **D-04:** Service selection behavior:
  - Tapping a service row **selects exactly one service and immediately navigates** to the next step (Phase 2 placeholder route is acceptable).
  - A footer CTA exists but is **disabled/hidden until a service is selected**; after selection it becomes available (primarily useful for accessibility and clear primary action).
- **D-05:** Fighter profile **stats are required in Phase 2** (displayed similarly to the design reference). The API/model must carry these fields (or a structured equivalent) so the UI can render them without hardcoding.

### UI stack alignment

- **D-06:** Implement the UI using **Ionic/Angular components and styling** (do not adopt Tailwind for the Angular app to match the HTML design references).

### Carry-forward constraints from Phase 1 (must remain compatible)

- **D-07:** Auth/session model remains cookie-based (httpOnly refresh strategy). Phase 2 public catalog/profile should not depend on login; booking flow entry can remain compatible with Phase 3 auth requirements.
- **D-08:** Maintain iOS/Capacitor friendliness (avoid approaches that break in WKWebView; keep navigation/state robust across refresh/deep-link).

### Claude's Discretion

- Exact catalog card layout density (featured card vs uniform cards) as long as it follows the canonical design references.
- Whether the placeholder booking route is a dedicated page or reuses an existing shell; exact route naming as long as it encodes fighterId + serviceId.
- Empty/loading/error state visuals (must follow DESIGN.md “no-line” rule).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope / acceptance

- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, and plan breakdown (02-01 … 02-03).
- `.planning/REQUIREMENTS.md` — CAT-01…CAT-03 and FTR-01…FTR-03 acceptance criteria.
- `.planning/PROJECT.md` — constraints, out-of-scope items, and the end-to-end booking loop.

### Design contract (source of truth for look/feel)

- `DESIGN.md` — “Kinetic Gallery” rules (no 1px borders, depth via tonal layering, glass/gradient guidance).
- `src/design/explore_fighters/code.html` — Explore/Catalog visual reference: chips, sticky filter bar, editorial hero, fighter cards.
- `src/design/fighter_profile/code.html` — Fighter profile reference: hero, stats tiles, bio section, services list, CTA behavior (adapted to D-04).
- `src/design/home_elite_athletic/code.html` — App shell reference: header + bottom nav styling and typography scale.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- Existing Ionic/Angular route setup in `src/app/app.routes.ts` with auth guard usage (`authGuard`).
- Existing auth client patterns (guard + interceptor + `AuthService`) to follow for API calls.

### Established Patterns

- Angular standalone components with Ionic standalone imports (Phase 1 pages).
- Backend is NestJS (Phase 1 decision) with auth/users/prisma baseline already present.

### Integration Points

- Add catalog/profile routes in `src/app/app.routes.ts` (public).
- Backend: add public read endpoints for fighters + fighter services (published only).
- Frontend: add a catalog API client + fighter profile API client consistent with existing auth interceptor conventions.
</code_context>

<specifics>
## Specific Ideas

- “From $X” is computed from the fighter’s bookable services (min price).
- Filters/chips should be visually present but **not** change the results yet (Phase 2).
- Service selection should create a clear “selected service” moment while moving forward immediately; footer CTA only becomes available after selection.
</specifics>

<deferred>
## Deferred Ideas

- Saved fighters / bookmarking — explicitly deferred (out of Phase 2 scope).
</deferred>

---

*Phase: 02-catalog-fighter-profile*  
*Context gathered: 2026-04-24*
