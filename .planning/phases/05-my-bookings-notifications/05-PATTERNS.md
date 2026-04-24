# Phase 05: My bookings & notifications - Pattern Map

**Mapped:** 2026-04-24  
**Files analyzed:** 11 (estimated new/modified for Phase 05)  
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/src/bookings/bookings.controller.ts` (mod) | controller | request-response | `backend/src/bookings/bookings.controller.ts` | exact |
| `backend/src/bookings/bookings.service.ts` (mod) | service | CRUD/transform | `backend/src/bookings/bookings.service.ts` | exact |
| `backend/src/bookings/dto/booking.dto.ts` (mod) | model/dto | transform | `backend/src/bookings/dto/booking.dto.ts` | exact |
| `backend/src/notifications/notifications.service.ts` (new) | service | event-driven/logging | `backend/src/auth/auth.service.ts` | role-match |
| `backend/src/notifications/notifications.module.ts` (new) | module/config | config | `backend/src/payments/payments.module.ts` / `backend/src/auth/auth.module.ts` | role-match |
| `backend/src/payments/payments.service.ts` (mod) | service | event-driven (webhook) | `backend/src/payments/payments.service.ts` | exact |
| `src/app/pages/my-bookings/my-bookings.page.ts` (new) | component/page | request-response | `src/app/pages/catalog/catalog.page.ts` | role-match |
| `src/app/pages/my-bookings/my-bookings.page.html` (new) | component template | view | `src/app/pages/catalog/catalog.page.html` | role-match |
| `src/app/pages/booking-detail/booking-detail.page.ts` (new) | component/page | request-response | `src/app/pages/booking-success/booking-success.page.ts` | exact-ish |
| `src/app/core/services/booking.service.ts` (mod) | service | request-response | `src/app/core/services/booking.service.ts` | exact |
| `src/app/app.routes.ts` (mod) | config/routes | request-response | `src/app/app.routes.ts` | exact |

## Pattern Assignments

### `backend/src/bookings/bookings.controller.ts` (controller, request-response)

**Analog:** `backend/src/bookings/bookings.controller.ts`

**Auth guard + user scoping via `req.user.sub`** (lines 1-17):

```9:17:backend/src/bookings/bookings.controller.ts
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get(':id')
  @UseGuards(JwtAccessAuthGuard)
  async getById(@Req() req: { user: JwtUser }, @Param('id') id: string) {
    return await this.bookings.getBookingForUser({ bookingId: id, userId: req.user.sub });
  }
```

**Stable conflict contract for UI** (lines 22-37):

```22:37:backend/src/bookings/bookings.controller.ts
  async create(@Req() req: { user: JwtUser }, @Body() dto: CreateBookingDto) {
    try {
      return await this.bookings.createBooking({ userId: req.user.sub, slotId: dto.slotId });
    } catch (e) {
      // Standardize concurrency conflicts to a stable, UI-actionable contract.
      if (e instanceof ConflictException) {
        const res = e.getResponse();
        const code = typeof res === 'object' && res !== null ? (res as { code?: unknown }).code : undefined;
        if (code === SLOT_UNAVAILABLE_CODE) {
          throw new ConflictException({
            code: SLOT_UNAVAILABLE_CODE,
            message: 'That time is no longer available. Please pick another slot.',
          });
        }
      }
      throw e;
    }
  }
```

**Apply to Phase 05:** add `@Get()` list endpoint, keep `@UseGuards(JwtAccessAuthGuard)` + `req.user.sub` scoping, return DTOs (avoid userId query param).

---

### `backend/src/bookings/bookings.service.ts` (service, CRUD/transform)

**Analog:** `backend/src/bookings/bookings.service.ts`

**Prisma user-scoped read + select shaping into DTO** (lines 10-42):

```10:42:backend/src/bookings/bookings.service.ts
  async getBookingForUser(input: { bookingId: string; userId: string }): Promise<BookingDto> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: input.bookingId, userId: input.userId },
      select: {
        id: true,
        status: true,
        expiresAtUtc: true,
        slot: {
          select: {
            id: true,
            startsAtUtc: true,
            endsAtUtc: true,
            fighterId: true,
            serviceId: true,
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: booking.id,
      status: booking.status,
      expiresAtUtc: booking.expiresAtUtc.toISOString(),
      slot: {
        slotId: booking.slot.id,
        startsAtUtc: booking.slot.startsAtUtc.toISOString(),
        endsAtUtc: booking.slot.endsAtUtc.toISOString(),
        fighterId: booking.slot.fighterId,
        serviceId: booking.slot.serviceId,
      },
    };
  }
```

**Transactional slot hold reservation (guarded updateMany)** (lines 51-91):

```51:91:backend/src/bookings/bookings.service.ts
    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({
        where: { id: slotId },
        select: {
          id: true,
          startsAtUtc: true,
          endsAtUtc: true,
          fighterId: true,
          serviceId: true,
        },
      });

      if (!slot) throw new NotFoundException('Slot not found');

      const booking = await tx.booking.create({
        data: {
          userId,
          fighterId: slot.fighterId,
          serviceId: slot.serviceId,
          slotId: slot.id,
          status: 'awaiting_payment',
          expiresAtUtc,
        },
        select: { id: true, status: true, expiresAtUtc: true },
      });

      const reservation = await tx.slot.updateMany({
        where: {
          id: slot.id,
          confirmedBookingId: null,
          OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
        },
        data: {
          reservedUntilUtc: booking.expiresAtUtc,
          reservedBookingId: booking.id,
        },
      });

      if (reservation.count === 0) {
        throw new ConflictException({ code: SLOT_UNAVAILABLE_CODE });
      }
```

**Apply to Phase 05:** expiry routine should follow same style: Prisma query + conditional update (idempotent) inside transaction, and only emit notification when transition actually applied.

---

### `backend/src/bookings/dto/booking.dto.ts` (dto/model, transform)

**Analog:** `backend/src/bookings/dto/booking.dto.ts`

**Current DTO shape baseline** (lines 1-14):

```1:14:backend/src/bookings/dto/booking.dto.ts
export type BookingSlotDto = {
  slotId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  fighterId: string;
  serviceId: string;
};

export class BookingDto {
  id!: string;
  status!: string;
  expiresAtUtc!: string;
  slot!: BookingSlotDto;
}
```

**Apply to Phase 05:** extend DTO with fighter/service display fields (names/titles) + pricing/payment fields. Keep DTO style: plain TS types/classes, ISO strings.

---

### `backend/src/notifications/notifications.service.ts` (new service, event-driven/logging)

**Analog 1 (dev-only logging precedent):** `backend/src/auth/auth.service.ts`

**Dev-only email equivalent log** (lines 110-129):

```110:129:backend/src/auth/auth.service.ts
  async forgotPassword(dto: RequestResetDto) {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);
    if (user) {
      const plaintext = randomBytes(32).toString('hex');
      const tokenHash = sha256Hex(plaintext);
      const expiresAt = new Date(Date.now() + RESET_MS);
      await this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
      if (process.env.NODE_ENV === 'development') {
        this.logger.log(
          `[DEV ONLY] Password reset link: http://localhost:8100/reset-password?token=${plaintext}`,
        );
      }
    }
    return {
      message: 'If an account exists, instructions were sent.',
    };
  }
```

**Analog 2 (deep link construction):** `backend/src/payments/payments.service.ts`

**URL building using `PUBLIC_APP_URL`** (lines 32-58):

```32:58:backend/src/payments/payments.service.ts
    const appUrl = process.env.PUBLIC_APP_URL;
    if (!appUrl) throw new Error('PUBLIC_APP_URL is required');

    const successUrl = new URL('/pay/return', appUrl);
    successUrl.searchParams.set('bookingId', booking.id);
    successUrl.searchParams.set('result', 'success');

    const cancelUrl = new URL('/pay/return', appUrl);
    cancelUrl.searchParams.set('bookingId', booking.id);
    cancelUrl.searchParams.set('result', 'cancel');
```

**Apply to Phase 05:** notifications service should use `Logger` pattern + `PUBLIC_APP_URL` deep link building (to booking detail route) and log minimal transactional payload.

---

### `backend/src/payments/payments.service.ts` (service, event-driven webhook)

**Analog:** `backend/src/payments/payments.service.ts`

**Webhook idempotency record** (lines 90-100):

```90:100:backend/src/payments/payments.service.ts
  async processStripeEvent(event: Stripe.Event): Promise<void> {
    // Persist idempotency key first (D-09).
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { stripeEventId: event.id, type: event.type },
        select: { id: true },
      });
    } catch {
      // Duplicate event id (or race) — treat as idempotent success.
      return;
    }
```

**Confirmed transition inside transaction** (lines 118-147):

```118:147:backend/src/payments/payments.service.ts
    await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        select: { id: true, status: true, slotId: true, stripeCheckoutSessionId: true },
      });
      if (!booking) return;
      if (booking.status === 'confirmed') return;
      if (booking.status !== 'awaiting_payment') return;

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'confirmed',
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId ?? input.stripeCheckoutSessionId,
        },
        select: { id: true },
      });

      await tx.slot.updateMany({
        where: {
          id: booking.slotId,
          OR: [{ confirmedBookingId: null }, { confirmedBookingId: booking.id }],
        },
        data: {
          confirmedBookingId: booking.id,
          reservedBookingId: null,
          reservedUntilUtc: null,
        },
      });
    });
```

**Apply to Phase 05:** notification emission should be anchored to “transition actually applied” (only when booking updated from awaiting→confirmed) to avoid duplicates on retries.

---

### `src/app/core/services/booking.service.ts` (service, request-response)

**Analog:** `src/app/core/services/booking.service.ts`

**API call w/ `withCredentials: true`** (lines 60-64):

```60:64:src/app/core/services/booking.service.ts
  getBooking(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/${encodeURIComponent(bookingId)}`, {
      withCredentials: true,
    });
  }
```

**Error coercion for stable UI handling** (lines 14-29):

```14:29:src/app/core/services/booking.service.ts
function coerceCreateBookingError(err: unknown): CreateBookingError {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as unknown;
    const code =
      body && typeof body === 'object' && 'code' in body && typeof (body as any).code === 'string'
        ? ((body as any).code as string)
        : undefined;
    const message =
      body && typeof body === 'object' && 'message' in body && typeof (body as any).message === 'string'
        ? ((body as any).message as string)
        : typeof err.message === 'string'
          ? err.message
          : undefined;
    return { status: err.status, code, message, raw: body };
  }
  return { status: 0, raw: err };
}
```

**Apply to Phase 05:** add `listMyBookings()` with same `withCredentials` pattern; if new error types needed, copy coercion style (avoid leaking raw unknowns into templates).

---

### `src/app/app.routes.ts` (routes/config, request-response)

**Analog:** `src/app/app.routes.ts`

**Lazy standalone page routes** (lines 4-28):

```4:28:src/app/app.routes.ts
export const routes: Routes = [
  {
    path: 'explore',
    loadComponent: () => import('./pages/catalog/catalog.page').then((m) => m.CatalogPage),
  },
  {
    path: 'fighters/:fighterId',
    loadComponent: () =>
      import('./pages/fighter-profile/fighter-profile.page').then((m) => m.FighterProfilePage),
  },
  {
    path: 'pay/return',
    loadComponent: () =>
      import('./pages/payment-return/payment-return.page').then((m) => m.PaymentReturnPage),
  },
  {
    path: 'booking/success',
    loadComponent: () =>
      import('./pages/booking-success/booking-success.page').then((m) => m.BookingSuccessPage),
  },
```

**Auth-guarded route** (lines 51-55):

```51:55:src/app/app.routes.ts
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
    canActivate: [authGuard],
  },
```

**Apply to Phase 05:** new “My bookings” + booking detail routes should match this lazy `loadComponent` pattern and use `canActivate: [authGuard]`.

---

### `src/app/pages/my-bookings/my-bookings.page.ts` (new page, request-response)

**Analog:** `src/app/pages/catalog/catalog.page.ts`

**Page fetch pattern: `ionViewWillEnter()` + loading/error + `finalize`** (lines 47-65):

```47:65:src/app/pages/catalog/catalog.page.ts
  ionViewWillEnter(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.catalog
      .getFighters()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (fighters) => (this.fighters = fighters ?? []),
        error: () => {
          this.fighters = [];
          this.error = "Couldn’t load fighters. Check your connection and try again.";
        },
      });
  }
```

**Ionic import style (standalone components)** (lines 1-14, 19-35):

```1:14:src/app/pages/catalog/catalog.page.ts
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSkeletonText,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
```

**Apply to Phase 05:** “My bookings” should follow same loading/error/skeleton approach; tabs can be implemented using Ionic components not yet used elsewhere (no strong in-repo analog for `IonSegment` / `IonTabs` beyond HTML usage).

---

### `src/app/pages/booking-detail/booking-detail.page.ts` (new page, request-response)

**Analog:** `src/app/pages/booking-success/booking-success.page.ts`

**Query-param driven booking load with skeleton + error** (lines 23-45):

```23:45:src/app/pages/booking-success/booking-success.page.ts
  ionViewWillEnter(): void {
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    if (!bookingId) {
      this.loading = false;
      this.error = 'Missing bookingId.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.data = null;
    this.booking
      .getBooking(bookingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (b) => {
          this.data = b;
        },
        error: () => {
          this.error = 'Could not load booking.';
        },
      });
  }
```

**Alternate analog for route params:** `src/app/pages/fighter-profile/fighter-profile.page.ts` reads `paramMap` and navigates (lines 51-57, 86-94).

**Apply to Phase 05:** booking detail should probably use `:bookingId` path param (deep link friendly), but this file shows the established “load on enter + skeleton + error” pattern to copy.

## Shared Patterns

### Backend: Auth guard + scoping
**Source:** `backend/src/bookings/bookings.controller.ts` + `backend/src/auth/guards/jwt-access.guard.ts`  
**Apply to:** `GET /bookings`, `GET /bookings/:id` and any “my bookings” endpoints.

```1:6:backend/src/auth/guards/jwt-access.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessAuthGuard extends AuthGuard('jwt-access') {}
```

### Backend: Time + “expired hold” precedent
**Source:** `backend/src/availability/availability.service.ts`  
**Apply to:** expiry routine should compute `now` once and reuse; Prisma filters use `lt: nowUtc` convention.

```47:58:backend/src/availability/availability.service.ts
    const startUtc = startLocal.toUTC().toJSDate();
    const endUtcExclusive = startLocal.plus({ days }).toUTC().toJSDate();
    const nowUtc = DateTime.utc().toJSDate();

    const availableSlots = await this.prisma.slot.findMany({
      where: {
        fighterId: service.fighterId,
        serviceId: service.id,
        startsAtUtc: { gte: startUtc, lt: endUtcExclusive },
        confirmedBookingId: null,
        OR: [{ reservedUntilUtc: null }, { reservedUntilUtc: { lt: nowUtc } }],
      },
```

### Frontend: Auth-gated pages
**Source:** `src/app/core/guards/auth.guard.ts` + `src/app/app.routes.ts`  
**Apply to:** My bookings list + booking detail.

```6:12:src/app/core/guards/auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.loadProfile().pipe(
    map((u) => (u ? true : router.createUrlTree(['/login']))),
  );
};
```

## No Analog Found

No strong in-repo analog for Ionic tab UI implementing “Upcoming/Past” (e.g. `IonSegment`/`IonTabs` patterns) — closest is list page patterns (`CatalogPage`) and existing HTML usage of `ion-chip`. Planner should pick Ionic primitive, follow existing import + state management style.

## Metadata

**Analog search scope:** `backend/src/{bookings,payments,auth,availability}` + `src/app/{pages,core,app.routes.ts}`  
**Pattern extraction date:** 2026-04-24

