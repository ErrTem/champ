# Phase 06: Admin — Pattern Map

**Mapped:** 2026-04-25  
**Files analyzed (planned new/modified):** 14  
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/prisma/schema.prisma` | schema | CRUD | `backend/prisma/schema.prisma` | exact |
| `backend/prisma/seed.ts` | seed | batch | `backend/prisma/seed.ts` | exact |
| `backend/src/auth/guards/admin.guard.ts` | guard | request-response | `backend/src/auth/guards/jwt-access.guard.ts` + `backend/src/users/users.service.ts` | role-match |
| `backend/src/admin/admin.module.ts` | module | request-response | `backend/src/bookings/bookings.module.ts` | role-match |
| `backend/src/admin/fighters.admin.controller.ts` | controller | CRUD | `backend/src/fighters/fighters.controller.ts` | role-match |
| `backend/src/admin/fighters.admin.service.ts` | service | CRUD | `backend/src/fighters/fighters.service.ts` | role-match |
| `backend/src/admin/services.admin.controller.ts` | controller | CRUD | `backend/src/fighters/fighters.controller.ts` (public) | partial |
| `backend/src/admin/services.admin.service.ts` | service | CRUD | `backend/src/fighters/fighters.service.ts` (nested select mapping) | partial |
| `backend/src/admin/schedule.admin.controller.ts` | controller | request-response | `backend/src/bookings/bookings.controller.ts` | role-match |
| `backend/src/admin/schedule.admin.service.ts` | service | transform | `backend/src/availability/availability.service.ts` + `backend/prisma/seed.ts` | partial |
| `backend/src/admin/bookings.admin.controller.ts` | controller | request-response | `backend/src/bookings/bookings.controller.ts` | role-match |
| `backend/src/admin/bookings.admin.service.ts` | service | CRUD | `backend/src/bookings/bookings.service.ts` | role-match |
| `backend/test/admin.*.e2e-spec.ts` | test | request-response | `backend/test/bookings.my-bookings.e2e-spec.ts` | role-match |
| `src/app/core/guards/admin.guard.ts` | guard | request-response | `src/app/core/guards/auth.guard.ts` | exact |
| `src/app/app.routes.ts` | routes | request-response | `src/app/app.routes.ts` | exact |
| `src/app/core/services/auth.service.ts` | service | request-response | `src/app/core/services/auth.service.ts` | exact |
| `src/app/pages/profile/profile.page.html` | page | request-response | `src/app/pages/profile/profile.page.html` | exact |
| `src/app/pages/admin/*` (tabs shell + 4 section pages) | page | request-response | `src/app/pages/my-bookings/*` + `src/app/pages/booking-detail/*` | role-match |

> Note: frontend admin pages/tabs do not exist yet; closest match uses same Ionic page + skeleton + empty/error state patterns from Phase 05 pages.

## Pattern Assignments

### `backend/src/auth/guards/admin.guard.ts` (guard, request-response)

**Goal:** stack on top of `JwtAccessAuthGuard`, then DB-check `User.isAdmin` by `req.user.sub`.

**Guard import/skeleton pattern** — copy from `backend/src/auth/guards/jwt-access.guard.ts` (lines 1–5):

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard('jwt-access') {}
```

**Req user shape** — copy from `backend/src/users/users.controller.ts` (lines 6–16):

```ts
type JwtUser = { sub: string; email: string };

@Get('me')
@UseGuards(JwtAccessAuthGuard)
async me(@Req() req: { user: JwtUser }) {
  return this.users.findSafeById(req.user.sub);
}
```

**DB lookup / safe error** — copy from `backend/src/users/users.service.ts` (lines 17–22):

```ts
async findSafeById(id: string) {
  const user = await this.findById(id);
  if (!user) throw new NotFoundException();
  const { passwordHash: _p, ...safe } = user;
  return safe;
}
```

**Admin deny behavior:** use Nest `ForbiddenException` (403) with stable message/code (planner chooses exact contract).

---

### `backend/src/admin/*.controller.ts` (controllers, CRUD/request-response)

**Guard stacking pattern** — copy from `backend/src/bookings/bookings.controller.ts` (lines 9–27) and layer admin guard:

```ts
@Controller('bookings')
export class BookingsController {
  @Get()
  @UseGuards(JwtAccessAuthGuard)
  async getMy(@Req() req: { user: JwtUser }) {
    return await this.bookings.getMyBookings({ userId: req.user.sub });
  }
}
```

Expected for admin controllers:
- `@Controller('admin/fighters')`, `@Controller('admin/services')`, `@Controller('admin/fighters/:fighterId/schedule-rules')`, `@Controller('admin/bookings')`
- `@UseGuards(JwtAccessAuthGuard, AdminGuard)` at controller or per-handler.

**Conflict standardization pattern** (if any admin endpoints need it) — copy from `backend/src/bookings/bookings.controller.ts` (lines 28–43), which unwraps `ConflictException` payload and rethrows stable `{ code, message }`.

---

### `backend/src/admin/fighters.admin.service.ts` (service, CRUD)

**Published drives public catalog** — copy selection/filter conventions from `backend/src/fighters/fighters.service.ts`:

- **List published** (lines 11–26):

```ts
const fighters = await this.prisma.fighter.findMany({
  where: { published: true },
  orderBy: { name: 'asc' },
  select: { id: true, name: true, photoUrl: true, summary: true, disciplines: true, services: { where: { published: true }, select: { priceCents: true } } },
});
```

- **Profile filters services by `published`** (lines 43–69):

```ts
services: {
  where: { published: true },
  orderBy: { priceCents: 'asc' },
  select: { id: true, title: true, durationMinutes: true, modality: true, priceCents: true, currency: true },
},
```

Admin CRUD should write existing `Fighter.published` boolean (schema line 48) to affect public endpoints immediately.

---

### `backend/src/admin/bookings.admin.service.ts` (service, CRUD)

**Deterministic ordering pattern** — copy from `backend/src/bookings/bookings.service.ts` (lines 78–89):

```ts
const bookings = await this.prisma.booking.findMany({
  where: { userId: input.userId },
  select: { /* ... */ },
  orderBy: [{ slot: { startsAtUtc: 'asc' } }, { id: 'asc' }],
});
```

Admin bookings list should keep same tie-break ordering style (`slot.startsAtUtc asc`, then `booking.id asc`) for stable pagination and UI.

**Reserved/confirmed semantics** (for “don’t mutate confirmed / don’t break holds”) — copy slot visibility conditions from `backend/src/availability/availability.service.ts` (lines 51–61):

```ts
where: {
  startsAtUtc: { gte: startUtc, lt: endUtcExclusive },
  confirmedBookingId: null,
  OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
},
```

Use same fields from schema `Slot` (schema lines 109–131): `reservedUntilUtc`, `reservedBookingId`, `confirmedBookingId`.

---

### `backend/src/admin/schedule.admin.service.ts` (service, transform)

**Schedule rules replace-all pattern** — seed already does “wipe + createMany” for rules. Copy from `backend/prisma/seed.ts` (lines 226–236):

```ts
await prisma.fighterScheduleRule.deleteMany({ where: { fighterId: fighter.id } });
await prisma.fighterScheduleRule.createMany({
  data: rules.map((r) => ({
    fighterId: fighter.id,
    dayOfWeek: r.dayOfWeek,
    startMinute: r.startMinute,
    endMinute: r.endMinute,
    active: true,
  })),
});
```

**Slot candidate generation + idempotent upsert** — reuse availability slot generator structure from `backend/src/availability/availability.service.ts`:

- `createMany({ skipDuplicates: true })` (lines 43–45)
- `generateCandidateSlots()` implementation (lines 108–145)
- timezone constant `AVAILABILITY_TIMEZONE` is `America/Los_Angeles` (availability imports line 4; UI-SPEC requires PT display/input)

Planner can implement regen as:
- compute PT day window (Luxon `DateTime.now().setZone('America/Los_Angeles').startOf('day')`)
- generate desired slots per service using same algorithm
- `slot.createMany({ data: desired, skipDuplicates: true })`
- delete obsolete only when safe (exclude `confirmedBookingId != null`; also avoid active holds by checking `reservedUntilUtc` like availability does).

---

### `backend/prisma/schema.prisma` (schema, CRUD)

**Admin flag location** — `User` model currently (lines 10–21) has only identity + auth relations. Add field near identity block:

```prisma
model User {
  // ...
  isAdmin Boolean @default(false)
  // ...
}
```

Keep using existing `published` booleans already in schema:
- `Fighter.published` (line 48)
- `Service.published` (line 74)

---

### `backend/prisma/seed.ts` (seed, batch)

**Upsert pattern** for stable seed updates — copy from `backend/prisma/seed.ts` test user block (lines 178–192):

```ts
await prisma.user.upsert({
  where: { email: TEST_USER.email },
  create: { email: TEST_USER.email, passwordHash, name: TEST_USER.name },
  update: { passwordHash, name: TEST_USER.name },
});
```

Admin provisioning (D-02) should follow same `upsert` shape, but set `isAdmin: true` and use env-driven email/password (planner decides exact env names).

---

### `backend/test/admin.*.e2e-spec.ts` (tests, request-response)

**App bootstrap + cookie agent** — copy from `backend/test/helpers/test-app.ts` (lines 10–37):

```ts
const app = moduleRef.createNestApplication({ rawBody: true });
app.use(cookieParser());
await app.init();
const request = supertest.agent(app.getHttpServer());
```

**Cookie extraction helper** — copy from `backend/test/bookings.my-bookings.e2e-spec.ts` (lines 6–15):

```ts
function cookieHeaderFromSetCookie(setCookies: unknown): string {
  const arr = typeof setCookies === 'string' ? [setCookies] : Array.isArray(setCookies) ? (setCookies as string[]) : [];
  const parts = arr.map((c) => c.split(';')[0]?.trim()).filter(Boolean);
  return parts.join('; ');
}
```

**DB reset** — copy from `backend/test/helpers/test-db.ts` (lines 8–20) which truncates domain tables deterministically.

Use same pattern to:
- create admin user in DB (or seed) with `isAdmin=true`
- login via `/auth/login` or `/auth/register` then patch DB to admin (planner choice)
- assert non-admin gets 403 on `/admin/*`
- assert admin CRUD updates reflect in public `GET /fighters` and `GET /fighters/:id` (reuse `FightersService` behavior)

---

### `src/app/core/guards/admin.guard.ts` (frontend guard, request-response)

**Guard skeleton + redirect** — copy from `src/app/core/guards/auth.guard.ts` (lines 1–12):

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(map((u) => (u ? true : router.createUrlTree(['/login']))));
};
```

Admin guard should use same `loadProfile()` call, but predicate becomes `u?.isAdmin === true`, and redirect target per UI-SPEC is Profile (e.g. `/profile`).

---

### `src/app/core/services/auth.service.ts` (frontend service, request-response)

**Profile load with credentials** — copy from `src/app/core/services/auth.service.ts` (lines 26–35):

```ts
return this.http.get<AuthUser>(`${this.baseUrl}/users/me`, { withCredentials: true }).pipe(
  tap((u) => this._user.set(u)),
  catchError(() => {
    this._user.set(null);
    return of(null);
  }),
);
```

**User shape extension point** — `AuthUser` today (lines 7–12):

```ts
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};
```

Add `isAdmin: boolean` (or role field) here to drive profile link + route guard.

---

### `src/app/app.routes.ts` (routing)

**Lazy route style** — copy existing pattern from `src/app/app.routes.ts` (lines 4–66): `loadComponent: () => import('...').then((m) => m.XPage)` and `canActivate: [authGuard]` on protected pages.

Admin routes should follow same:
- parent `/admin` route with `canActivate: [adminGuard]`
- children for tabs or direct pages (implementation choice; no existing tabs pattern in codebase)

---

### `src/app/pages/profile/profile.page.html` (entry link)

**Profile form layout + link style** — copy from existing footer link row `src/app/pages/profile/profile.page.html` (lines 43–45):

```html
<ion-button expand="block" fill="outline" type="button" (click)="logout()">Log out</ion-button>
<p class="footer-links"><a routerLink="/home">Home</a></p>
```

Admin entry should be conditional on admin flag (UI-SPEC + Phase 06 context). Planner should keep it in same footer-links area, using `routerLink="/admin"` and hiding when `auth.user()?.isAdmin` false.

---

### `src/app/pages/admin/*` (Ionic pages + tabs shell)

No existing tabs shell. Build pages using established “Phase 05 page” visual patterns:

**Loading skeleton + empty/error + retry CTA** — copy from `src/app/pages/my-bookings/my-bookings.page.html`:

- Skeleton list (lines 23–35)
- Error state + retry button `.kinetic-gradient` (lines 36–41)
- Empty state (lines 42–47)

**Row list interaction** — copy from `src/app/pages/my-bookings/my-bookings.page.html` (lines 49–62) with `<button class="row" type="button" (click)=...>` and chip status.

**Read-only detail card** — copy from `src/app/pages/booking-detail/booking-detail.page.html` (lines 20–65): card layout, meta rows, chip accent, primary action button pattern (admin page should omit actions per ADM-05).

## Shared Patterns (Cross-cutting)

### Backend auth guard stacking
**Source:** `backend/src/bookings/bookings.controller.ts` (guards) + `backend/src/auth/guards/jwt-access.guard.ts`  
**Apply to:** all `/admin/*` endpoints

### Prisma “published” as public visibility
**Source:** `backend/src/fighters/fighters.service.ts` (published filters) + `backend/prisma/schema.prisma` (`published` fields)  
**Apply to:** admin fighters/services CRUD

### Slot safety: confirmed + reserved-until
**Source:** `backend/src/availability/availability.service.ts` (slot availability filters) + `backend/prisma/schema.prisma` (slot fields)  
**Apply to:** schedule regen safe delete + bookings list query correctness

### Deterministic ordering
**Source:** `backend/src/bookings/bookings.service.ts` (orderBy startsAtUtc asc, id asc) + `backend/test/bookings.my-bookings.e2e-spec.ts` (assert sorting)  
**Apply to:** admin bookings list (filters + pagination)

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| *(none)* | | | All core patterns have close analogs. Tabs shell lacks direct match but can be assembled from existing Ionic page patterns. |

## Metadata

**Analog search scope:** `src/app/**`, `backend/src/**`, `backend/prisma/**`, `backend/test/**`  
**Pattern extraction date:** 2026-04-25

