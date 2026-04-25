import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class AdminScheduleRuleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsInt()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  @IsInt()
  @Min(1)
  @Max(1440)
  endMinute!: number;

  @IsBoolean()
  active!: boolean;
}

export class ReplaceScheduleRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminScheduleRuleDto)
  rules!: AdminScheduleRuleDto[];
}

