import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFighterSelfServiceDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsString()
  @IsIn(['online', 'in_person'])
  modality!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateFighterSelfServiceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @IsIn(['online', 'in_person'])
  modality?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export type FighterSelfServiceDto = {
  id: string;
  fighterId: string;
  title: string;
  durationMinutes: number;
  modality: string;
  priceCents: number;
  currency: string;
  published: boolean;
};

