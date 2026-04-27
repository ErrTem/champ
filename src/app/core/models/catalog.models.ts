export type FighterListItem = {
  id: string;
  name: string;
  photoUrl?: string | null;
  summary: string;
  fromPriceCents: number | null;
  disciplines?: string[];
};

export type Service = {
  id: string;
  title: string;
  durationMinutes: number;
  modality: string;
  priceCents: number;
  currency: string;
};

export type Gym = {
  id: string;
  name: string;
  timezone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
};

export type FighterProfile = {
  id: string;
  name: string;
  photoUrl?: string | null;
  bio: string;
  disciplines?: string[];
  mediaUrls?: string[];
  wins: number;
  losses: number;
  draws: number;
  yearsPro: number;
  gym: Gym;
  services: Service[];
};

