export interface Slot {
  slotId: string;
  startsAtUtc: string;
  endsAtUtc: string;
}

export interface AvailabilityDay {
  date: string;
  slots: Slot[];
}

export interface AvailabilityResponse {
  timezone: string;
  range: { fromDate: string; days: number };
  days: AvailabilityDay[];
}

export interface CreateBookingRequest {
  slotId: string;
}

export interface BookingListItem {
  id: string;
  status: string;
  expiresAtUtc: string;
  startsAtUtc: string;
  endsAtUtc: string;
  fighterId: string;
  fighterName: string;
  serviceId: string;
  serviceTitle: string;
  priceCents: number;
  currency: string;
  paymentState: string;
}

export interface Booking {
  id: string;
  status: string;
  expiresAtUtc: string;
  slot: {
    slotId: string;
    startsAtUtc: string;
    endsAtUtc: string;
    fighterId: string;
    serviceId: string;
  };
  startsAtUtc?: string;
  endsAtUtc?: string;
  fighterId?: string;
  fighterName?: string;
  serviceId?: string;
  serviceTitle?: string;
  priceCents?: number;
  currency?: string;
  paymentState?: string;
}

