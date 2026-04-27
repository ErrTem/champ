import { IsArray, IsBoolean, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateAdminFighterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  xUrl?: string;

  @IsOptional()
  @IsArray()
  disciplines?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateAdminFighterDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(2048)
  xUrl?: string;

  @IsOptional()
  @IsArray()
  disciplines?: string[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export type AdminFighterDto = {
  id: string;
  name: string;
  summary: string;
  bio: string;
  photoUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  xUrl: string | null;
  disciplines: string[];
  published: boolean;
};

