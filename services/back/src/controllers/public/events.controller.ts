import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventsService } from '../../core/application/events.service';
import { SlotsService } from '../../core/application/slots.service';
import { BookingsService } from '../../core/application/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Event } from '../../core/domain/event';
import { Booking } from '../../core/domain/booking';

@Controller('public/events')
export class PublicEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly slots: SlotsService,
    private readonly bookings: BookingsService,
  ) {}

  @Get()
  list(): Event[] {
    return this.events.listActive();
  }

  @Get(':slug')
  read(@Param('slug') slug: string): Event {
    return this.events.getActiveBySlug(slug);
  }

  @Get(':slug/slots')
  getSlots(@Param('slug') slug: string, @Query('date') date: string) {
    const event = this.events.getActiveBySlug(slug);
    const slots = this.slots.getForEvent(event, date);
    return {
      date,
      eventSlug: event.slug,
      duration: event.duration,
      slots,
    };
  }

  @Post(':slug/bookings')
  @HttpCode(201)
  createBooking(
    @Param('slug') slug: string,
    @Body() body: CreateBookingDto,
  ) {
    const booking: Booking = this.bookings.create(slug, body);
    return {
      id: booking.id,
      eventId: booking.eventId,
      startTime: booking.startTime,
      status: booking.status,
      cancelToken: booking.cancelToken,
      guest: booking.guest,
      createdAt: booking.createdAt,
    };
  }
}
