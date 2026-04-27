import { Type } from 'class-transformer';
import { IsDefined, IsISO8601, ValidateNested } from 'class-validator';
import { GuestDto } from './guest.dto';

export class CreateBookingDto {
  @IsISO8601()
  startTime!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => GuestDto)
  guest!: GuestDto;
}
