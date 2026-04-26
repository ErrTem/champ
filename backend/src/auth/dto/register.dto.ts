import { Equals, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  phone!: string;

  @Equals(true)
  acceptedTerms!: boolean;

  @Equals(true)
  confirmedAdult!: boolean;

  @IsIn(['user', 'fighter'])
  profileType!: 'user' | 'fighter';
}
