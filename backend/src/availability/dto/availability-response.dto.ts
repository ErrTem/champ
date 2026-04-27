import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SlotDto } from './slot.dto';

export class AvailabilityRangeDto {
  @IsString()
  fromDate!: string;

  @IsInt()
  days!: number;
}

export class AvailabilityDayDto {
  @IsString()
  date!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots!: SlotDto[];
}

export class AvailabilityResponseDto {
  @IsString()
  timezone!: string;

  @ValidateNested()
  @Type(() => AvailabilityRangeDto)
  range!: AvailabilityRangeDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDayDto)
  days!: AvailabilityDayDto[];
}

