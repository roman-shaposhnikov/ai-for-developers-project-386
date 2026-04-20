import { IsString, Matches, IsBoolean, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class TimeBlockDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5][05]$/, {
    message: 'Time must be in HH:MM format with 5-minute granularity',
  })
  start: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5][05]$/, {
    message: 'Time must be in HH:MM format with 5-minute granularity',
  })
  end: string;
}

export class DayScheduleDto {
  @IsBoolean()
  enabled: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBlockDto)
  blocks: TimeBlockDto[];
}

export class WeekdaysDto {
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday: DayScheduleDto;

  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday: DayScheduleDto;
}

export class WeeklyScheduleDto {
  @ValidateNested()
  @Type(() => WeekdaysDto)
  weekdays: WeekdaysDto;
}
