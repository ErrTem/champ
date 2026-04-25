# Phase 6: Admin - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `06-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 06-admin
**Areas discussed:** Admin access model, Admin UI scope, Schedule editing semantics, Booking visibility

---

## Admin access model

| Option | Description | Selected |
|--------|-------------|----------|
| Single role: admin | One role grants all admin powers | ✓ |
| 2 roles: staff + admin | Split limited vs full | |
| Granular permissions | Per-area permissions | |

**Provisioning**

| Option | Description | Selected |
|--------|-------------|----------|
| Seed/script/env | Create first admin outside UI | ✓ |
| DB flip | Promote existing user manually | |
| Protected grant API | Only existing admin can grant | |

**Admin UI entry**

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden /admin route | No visible link | |
| Profile link | Link visible only to admins | ✓ |
| Home link | Link on home for admins | |

---

## Admin UI scope

**Device scope**

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive Ionic | Works phone + desktop | ✓ |
| Desktop-first | Phone usable but rough | |
| Desktop only | Block mobile | |

**Navigation**

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs | Tabbed sections | ✓ |
| Side menu | Hamburger menu | |
| Single list | One list + drill-in | |

**Sections**

| Option | Description | Selected |
|--------|-------------|----------|
| Fighters | Manage fighter profiles | ✓ |
| Services/prices | Manage services and pricing | ✓ |
| Schedule | Manage schedule rules | ✓ |
| Bookings | Read-only list + detail | ✓ |

---

## Schedule editing semantics

**Editing model**

| Option | Description | Selected |
|--------|-------------|----------|
| Weekly rules | Day-of-week + start/end windows | ✓ |
| Date overrides only | Exceptions only | |
| Both | Weekly + overrides | |

**Regeneration horizon**

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling 30 days | Regenerate future 30 days | ✓ |
| Rolling 60 days | Regenerate future 60 days | |
| Manual range | Admin picks range | |

**Conflict policy**

| Option | Description | Selected |
|--------|-------------|----------|
| Protect confirmed | Never touch confirmed-booking slots | ✓ |
| Protect any booking | Also protect awaiting-payment | |
| Allow but warn | Allow breaking changes with warning | |

**Timezone**

| Option | Description | Selected |
|--------|-------------|----------|
| America/Los_Angeles | Admin inputs/display in Pacific | ✓ |
| Per-fighter timezone | New concept | |
| Admin local timezone | Browser local time | |

---

## Booking visibility

**Scope**

| Option | Description | Selected |
|--------|-------------|----------|
| All bookings | Across all fighters | ✓ |
| By managed fighters | Needs mapping | |
| Support-only lookup | No full list | |

**Filters required**
- Status ✓
- Date range ✓
- Fighter ✓
- User email (not required)

**Actions**

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only | No mutations in admin v1 | ✓ |
| Cancel booking | New capability | |
| Internal notes | New data field | |

---

## Claude's Discretion

- Exact tab layouts and UX details per section.
- Exact admin route URL shape, as long as separated + guarded.
- Exact DB representation for admin role, as long as seedable and supports single admin role.
