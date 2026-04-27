import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDefined,
  Matches,
  ValidateNested,
} from 'class-validator';

export class TimeBlockDto {
  @Matches(/^([01]\d|2[0-3]):[0-5][05]$/)
  start!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5][05]$/)
  end!: string;
}

export class DayScheduleDto {
  @IsBoolean()
  enabled!: boolean;

  @IsArray()
  @ArrayMaxSize(48)
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  blocks!: TimeBlockDto[];
}

export class WeekdaysDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday!: DayScheduleDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday!: DayScheduleDto;
}

export class WeeklyScheduleDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => WeekdaysDto)
  weekdays!: WeekdaysDto;
}
