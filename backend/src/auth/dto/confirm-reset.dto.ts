import { IsString, MinLength } from 'class-validator';

export class ConfirmResetDto {
  @IsString()
  token!: string;

  @MinLength(8)
  password!: string;
}
