import { ServiceDto } from './service.dto';
import { GymDto } from '../../gyms/dto/gym.dto';

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

  gym!: GymDto;
  services!: ServiceDto[];
}

