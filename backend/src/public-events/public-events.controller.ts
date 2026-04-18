import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { PublicEventsService } from './public-events.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Event } from '../storage/entities/event.entity';
import { SlotsResponse } from '../storage/entities/slot.entity';
import { BookingWithEvent } from '../storage/entities/booking.entity';

@Controller('public/events')
export class PublicEventsController {
  constructor(private readonly publicEventsService: PublicEventsService) {}

  @Get()
  findAll(): Event[] {
    return this.publicEventsService.findAllActive();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Event {
    return this.publicEventsService.findActiveBySlug(slug);
  }

  @Get(':slug/slots')
  getSlots(
    @Param('slug') slug: string,
    @Query('date') date: string,
  ): SlotsResponse {
    if (!date) {
      throw new NotFoundException({
        code: 'VALIDATION_ERROR',
        message: 'Date parameter is required',
      });
    }
    return this.publicEventsService.getSlots(slug, date);
  }

  @Post(':slug/bookings')
  @HttpCode(HttpStatus.CREATED)
  createBooking(
    @Param('slug') slug: string,
    @Body() dto: CreateBookingDto,
  ): BookingWithEvent {
    return this.publicEventsService.createBooking(slug, dto);
  }
}
