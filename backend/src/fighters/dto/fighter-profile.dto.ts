import { ServiceDto } from './service.dto';

export class FighterProfileDto {
  id!: string;
  name!: string;
  photoUrl!: string | null;
  bio!: string;
  disciplines!: string[];
  mediaUrls!: string[];

  wins!: number;
  losses!: number;
  draws!: number;
  yearsPro!: number;

  services!: ServiceDto[];
}

