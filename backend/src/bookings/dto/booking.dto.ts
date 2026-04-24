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

