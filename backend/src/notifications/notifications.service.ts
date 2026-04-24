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

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const keep = local.length <= 2 ? 1 : 2;
  return `${local.slice(0, keep)}***@${domain}`;
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
    const includeRecipient = process.env.NODE_ENV !== 'production';
    this.emitDevEmail({
      eventType: 'booking.confirmed',
      from: 'noreply@champ.local',
      ...(includeRecipient ? { to: input.toEmail } : { to: maskEmail(input.toEmail) }),
      bookingId: input.bookingId,
      deepLink,
      fighterName: input.fighterName,
      serviceTitle: input.serviceTitle,
      startsAtUtc: toIsoMaybe(input.startsAtUtc),
    });
  }

  notifyBookingExpiredHold(input: NotifyBookingBaseInput): void {
    const deepLink = this.buildBookingDeepLink(input.bookingId);
    const includeRecipient = process.env.NODE_ENV !== 'production';
    this.emitDevEmail({
      eventType: 'booking.expired_hold',
      from: 'noreply@champ.local',
      ...(includeRecipient ? { to: input.toEmail } : { to: maskEmail(input.toEmail) }),
      bookingId: input.bookingId,
      deepLink,
      fighterName: input.fighterName,
      serviceTitle: input.serviceTitle,
      startsAtUtc: toIsoMaybe(input.startsAtUtc),
    });
  }
}

