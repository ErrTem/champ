import { IsOptional, IsString, Matches } from 'class-validator';

export class AdminBookingsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  fighterId?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

export type AdminBookingListItemDto = {
  id: string;
  status: string;
  startsAtUtc: string;
  fighter: { id: string; name: string };
  service: { id: string; title: string; priceCents: number; currency: string };
  user: { id: string; email: string; name: string | null };
};

export type AdminBookingDetailDto = AdminBookingListItemDto;

