export class GymDto {
  id!: string;
  name!: string;
  timezone!: string;

  addressLine1!: string;
  addressLine2!: string | null;
  city!: string;
  state!: string;
  postalCode!: string;
  countryCode!: string;
}

