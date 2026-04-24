# Phase 2: Catalog & fighter profile - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.  
> Decisions are captured in `02-CONTEXT.md` — this log preserves alternatives and the final picks.

**Date:** 2026-04-24  
**Phase:** 2 - Catalog & fighter profile  
**Areas discussed:** Catalog card price, filters behavior, bookmark scope, service-selection navigation, fighter profile stats, UI implementation stack

---

## Catalog card price

| Option | Description | Selected |
|--------|-------------|----------|
| From $X | Show minimum service price available for the fighter | ✓ |
| Featured service price | Show a specific “featured” service price | |
| No price | Only show price on fighter profile | |

**User's choice:** From $X

---

## Filters / chips behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Static UI | Visual chips/controls exist but do not filter results yet | ✓ |
| Real filtering | Chips/controls actually filter catalog results | |
| Hide filters | Do not show chips/filters until they work | |

**User's choice:** Static UI with no filtering yet

---

## Bookmark / saved fighters

| Option | Description | Selected |
|--------|-------------|----------|
| In scope | Add persistence + UX for saving fighters | |
| Out of scope | Do not implement in Phase 2 | ✓ |
| UI only | Show icon without persistence | |

**User's choice:** Out of scope

---

## Service selection → next step

| Option | Description | Selected |
|--------|-------------|----------|
| Tap row navigates | Selecting a service immediately navigates forward | ✓ |
| Select then CTA | Select a service, then press a CTA | |
| Mixed | Some services navigate, others do not | |

**User's choice:** Select service + go to next step; footer CTA only after a selection

---

## Fighter profile stats

| Option | Description | Selected |
|--------|-------------|----------|
| Required | Stats block is part of Phase 2 and must be backed by API | ✓ |
| Optional | Show only if data exists; not required for Phase 2 | |
| Omit v1 | Defer stats entirely | |

**User's choice:** Required in Phase 2

---

## UI implementation stack

| Option | Description | Selected |
|--------|-------------|----------|
| Ionic/Angular | Implement using Ionic components + Angular patterns | ✓ |
| Tailwind | Adopt Tailwind in Angular app to match static HTML | |
| Hybrid | Use Tailwind-like utilities only in some areas | |

**User's choice:** Ionic

---

## Claude's Discretion

- Exact layout density / “featured card” usage in catalog, as long as it matches `DESIGN.md` and `src/design/**` direction.
- Exact placeholder route naming, as long as it passes fighterId + serviceId reliably.
