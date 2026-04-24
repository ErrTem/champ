import { Injectable, Logger } from '@nestjs/common';

type NotifyBookingBaseInput = {
  bookingId: string;
  toEmail: string;
  fighterName?: string;
  serviceTitle?: string;
  startsAtUtc?: Date | string;
};

function toIsoMaybe(input: Date | string | undefined): string | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  return input.toISOString();
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private buildBookingDeepLink(bookingId: string): string {
    const appUrl = process.env.PUBLIC_APP_URL;
    if (!appUrl) throw new Error('PUBLIC_APP_URL is required');
    return new URL(`/bookings/${encodeURIComponent(bookingId)}`, appUrl).toString();
  }

  private emitDevEmail(payload: Record<string, unknown>): void {
    // Phase 05 requirement: dev-email equivalent via logs (swap point for real provider later).
    this.logger.log(`[DEV EMAIL] ${JSON.stringify(payload)}`);
  }

  notifyBookingConfirmed(input: NotifyBookingBaseInput): void {
    const deepLink = this.buildBookingDeepLink(input.bookingId);
    this.emitDevEmail({
      eventType: 'booking.confirmed',
      from: 'noreply@champ.local',
      to: input.toEmail,
      bookingId: input.bookingId,
      deepLink,
      fighterName: input.fighterName,
      serviceTitle: input.serviceTitle,
      startsAtUtc: toIsoMaybe(input.startsAtUtc),
    });
  }

  notifyBookingExpiredHold(input: NotifyBookingBaseInput): void {
    const deepLink = this.buildBookingDeepLink(input.bookingId);
    this.emitDevEmail({
      eventType: 'booking.expired_hold',
      from: 'noreply@champ.local',
      to: input.toEmail,
      bookingId: input.bookingId,
      deepLink,
      fighterName: input.fighterName,
      serviceTitle: input.serviceTitle,
      startsAtUtc: toIsoMaybe(input.startsAtUtc),
    });
  }
}

