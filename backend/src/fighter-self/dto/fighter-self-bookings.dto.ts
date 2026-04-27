import { IsOptional, IsString, MaxLength } from 'class-validator';

export type FighterSelfBookingListItemDto = {
  id: string;
  status: string;
  startsAtUtc: string;
  endsAtUtc: string;
  user: { id: string; email: string; name: string | null };
  service: { id: string; title: string; priceCents: number; currency: string };
};

export class CancelFighterBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

