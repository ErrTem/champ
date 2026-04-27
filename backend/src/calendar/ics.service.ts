import { Injectable } from '@nestjs/common';

function formatUtcForIcs(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

@Injectable()
export class IcsService {
  generateBookingIcs(input: { bookingId: string; startsAtUtc: Date; endsAtUtc: Date; fighterName: string }): string {
    const dtStamp = formatUtcForIcs(new Date());
    const dtStart = formatUtcForIcs(input.startsAtUtc);
    const dtEnd = formatUtcForIcs(input.endsAtUtc);
    const uid = `${input.bookingId}@champ`;

    const summary = escapeIcsText(`Training with ${input.fighterName}`);
    const description = escapeIcsText(`Booking ${input.bookingId}`);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CHAMP//Bookings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');
  }
}

