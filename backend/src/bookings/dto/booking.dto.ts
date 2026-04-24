export type BookingSlotDto = {
  slotId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  fighterId: string;
  serviceId: string;
};

export class BookingListItemDto {
  id!: string;
  status!: string;
  expiresAtUtc!: string;
  startsAtUtc!: string;
  endsAtUtc!: string;
  fighterId!: string;
  fighterName!: string;
  serviceId!: string;
  serviceTitle!: string;
  priceCents!: number;
  currency!: string;
  paymentState!: string;
}

export class BookingDto {
  id!: string;
  status!: string;
  expiresAtUtc!: string;
  slot!: BookingSlotDto;
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

