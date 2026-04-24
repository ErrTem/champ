import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { MAX_DAYS } from '../availability.constants';

export class AvailabilityQueryDto {
  @IsString()
  fighterId!: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fromDate?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(MAX_DAYS)
  days?: number;
}

