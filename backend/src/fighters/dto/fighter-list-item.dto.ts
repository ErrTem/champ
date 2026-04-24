export class FighterListItemDto {
  id!: string;
  name!: string;
  photoUrl!: string | null;
  summary!: string;
  disciplines!: string[];
  fromPriceCents!: number | null;
}

