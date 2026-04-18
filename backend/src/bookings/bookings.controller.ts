import { Controller, Get, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingWithEvent } from '../storage/entities/booking.entity';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  findAll(): BookingWithEvent[] {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): BookingWithEvent {
    return this.bookingsService.findById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@Param('id') id: string): void {
    this.bookingsService.cancel(id);
  }
}
