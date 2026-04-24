import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeClient } from './stripe.client';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeClient: StripeClient,
    private readonly notifications: NotificationsService,
  ) {}

  async createOrReuseCheckoutSession(input: {
    bookingId: string;
    userId: string;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: input.bookingId, userId: input.userId },
      select: {
        id: true,
        status: true,
        serviceId: true,
        stripeCheckoutSessionId: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'awaiting_payment') {
      throw new BadRequestException('Booking is not awaiting payment');
    }

    const appUrl = process.env.PUBLIC_APP_URL;
    if (!appUrl) throw new Error('PUBLIC_APP_URL is required');

    // Reuse existing active session when possible (D-04).
    if (booking.stripeCheckoutSessionId) {
      const session = await this.stripeClient.stripe.checkout.sessions.retrieve(
        booking.stripeCheckoutSessionId,
      );
      if (session.status !== 'expired' && session.url) {
        return { checkoutUrl: session.url, sessionId: session.id };
      }
    }

    const service = await this.prisma.service.findUnique({
      where: { id: booking.serviceId },
      select: { priceCents: true, currency: true, title: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const successUrl = new URL('/pay/return', appUrl);
    successUrl.searchParams.set('bookingId', booking.id);
    successUrl.searchParams.set('result', 'success');

    const cancelUrl = new URL('/pay/return', appUrl);
    cancelUrl.searchParams.set('bookingId', booking.id);
    cancelUrl.searchParams.set('result', 'cancel');

    const session = await this.stripeClient.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: service.currency.toLowerCase(),
            unit_amount: service.priceCents,
            product_data: {
              name: service.title,
            },
          },
        },
      ],
      metadata: { bookingId: booking.id },
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
    });

    if (!session.url) throw new Error('Stripe Checkout Session url missing');

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { stripeCheckoutSessionId: session.id },
      select: { id: true },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async processStripeEvent(event: Stripe.Event): Promise<void> {
    // Persist idempotency key first (D-09).
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { stripeEventId: event.id, type: event.type },
        select: { id: true },
      });
    } catch (e) {
      // Duplicate event id (or race) — treat as idempotent success.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return;
      throw e;
    }

    if (event.type !== 'checkout.session.completed') return;

    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    await this.confirmBookingAndConsumeSlot({
      bookingId,
      stripeCheckoutSessionId: session.id,
    });
  }

  private async confirmBookingAndConsumeSlot(input: {
    bookingId: string;
    stripeCheckoutSessionId?: string;
  }): Promise<void> {
    const didConfirm = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
        select: { id: true, status: true, slotId: true, stripeCheckoutSessionId: true },
      });
      if (!booking) return;
      if (booking.status === 'confirmed') return;
      if (booking.status !== 'awaiting_payment') return;

      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: 'awaiting_payment' },
        data: {
          status: 'confirmed',
          stripeCheckoutSessionId: booking.stripeCheckoutSessionId ?? input.stripeCheckoutSessionId,
        },
      });
      if (updated.count === 0) return false;

      await tx.slot.updateMany({
        where: {
          id: booking.slotId,
          reservedBookingId: booking.id,
          OR: [{ confirmedBookingId: null }, { confirmedBookingId: booking.id }],
        },
        data: {
          confirmedBookingId: booking.id,
          reservedBookingId: null,
          reservedUntilUtc: null,
        },
      });
      return true;
    });

    if (!didConfirm) return;

    const booking = await this.prisma.booking.findUnique({
      where: { id: input.bookingId },
      select: {
        id: true,
        user: { select: { email: true } },
        fighter: { select: { name: true } },
        service: { select: { title: true } },
        slot: { select: { startsAtUtc: true } },
      },
    });
    if (!booking) return;

    this.notifications.notifyBookingConfirmed({
      bookingId: booking.id,
      toEmail: booking.user.email,
      fighterName: booking.fighter.name,
      serviceTitle: booking.service.title,
      startsAtUtc: booking.slot.startsAtUtc,
    });
  }
}

