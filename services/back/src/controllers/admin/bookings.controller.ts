import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
} from '@nestjs/common';
import {
  BookingsService,
  BookingWithEventDto,
} from '../../core/application/bookings.service';

@Controller('bookings')
export class AdminBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(): BookingWithEventDto[] {
    return this.bookings.listUpcoming();
  }

  @Get(':id')
  read(@Param('id') id: string): BookingWithEventDto {
    return this.bookings.getByIdWithEvent(id);
  }

  @Delete(':id')
  @HttpCode(204)
  cancel(@Param('id') id: string): void {
    this.bookings.cancelByOwner(id);
  }
}
