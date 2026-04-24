import { IsIn, IsString } from 'class-validator';

export class SlotDto {
  @IsString()
  slotId!: string;

  @IsString()
  startsAtUtc!: string;

  @IsString()
  endsAtUtc!: string;

  @IsIn(['available', 'unavailable'])
  status!: 'available' | 'unavailable';
}

