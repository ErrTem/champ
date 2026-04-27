import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class FighterSelfScheduleRuleDto {
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

export class ReplaceFighterSelfScheduleRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FighterSelfScheduleRuleDto)
  rules!: FighterSelfScheduleRuleDto[];
}

