import { IsString, IsEmail, Length, IsOptional, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GuestDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}

export class CreateBookingDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/, {
    message: 'startTime must be in ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)',
  })
  startTime: string;

  @ValidateNested()
  @Type(() => GuestDto)
  guest: GuestDto;
}
