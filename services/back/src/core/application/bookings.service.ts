import { Injectable } from '@nestjs/common';
import { BookingsRepository } from '../../dal/bookings.repo';
import { ScheduleRepository } from '../../dal/schedule.repo';
import { Booking, BookingStatus } from '../domain/booking';
import { Event, toEventSummary } from '../domain/event';
import { Guest } from '../domain/guest';
import { DomainError } from '../domain/errors';
import { genCancelToken, genId } from '../domain/ids';
import { computeSlots } from './slots.service';
import { EventsService } from './events.service';
import { EventsRepository } from '../../dal/events.repo';
import { Clock } from './clock';

export interface CreateBookingInput {
  startTime: string;
  guest: Guest;
}

export interface BookingWithEventDto {
  id: string;
  eventId: string;
  startTime: string;
  status: BookingStatus;
  guest: Guest;
  createdAt: string;
  event: { title: string; slug: string; duration: number };
}

@Injectable()
export class BookingsService {
  constructor(
    private readonly bookings: BookingsRepository,
    private readonly schedule: ScheduleRepository,
    private readonly events: EventsService,
    private readonly eventsRepo: EventsRepository,
    private readonly clock: Clock,
  ) {}

  create(slug: string, input: CreateBookingInput): Booking {
    const event = this.events.getActiveBySlug(slug);
    const startTime = input.startTime;
    if (Number.isNaN(Date.parse(startTime))) {
      throw DomainError.validation('INVALID_START_TIME', 'startTime must be ISO 8601');
    }

    const date = startTime.slice(0, 10);
    const slots = computeSlots(
      event,
      this.schedule.get(),
      this.bookings.listActive(),
      date,
      this.clock.now(),
    );
    const matched = slots.find(
      (s) => Date.parse(s.startTime) === Date.parse(startTime),
    );
    if (!matched) {
      throw DomainError.conflict(
        'SLOT_UNAVAILABLE',
        `Requested slot is not available`,
      );
    }

    const booking: Booking = {
      id: genId(),
      eventId: event.id,
      startTime: matched.startTime,
      endTime: matched.endTime,
      status: 'active',
      guest: input.guest,
      createdAt: new Date().toISOString(),
      cancelToken: genCancelToken(),
    };
    this.bookings.save(booking);
    return booking;
  }

  listUpcoming(): BookingWithEventDto[] {
    const nowIso = this.clock.now().toISOString();
    const items = this.bookings.listActiveUpcoming(nowIso);
    return items
      .map((b) => this.toWithEvent(b))
      .filter((x): x is BookingWithEventDto => x !== null);
  }

  getByIdWithEvent(id: string): BookingWithEventDto {
    const booking = this.bookings.findById(id);
    if (!booking) {
      throw DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
    }
    const dto = this.toWithEvent(booking);
    if (!dto) {
      throw DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
    }
    return dto;
  }

  cancelByOwner(id: string): void {
    const booking = this.bookings.findById(id);
    if (!booking) {
      throw DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
    }
    if (booking.status !== 'active') {
      throw DomainError.conflict(
        'BOOKING_NOT_ACTIVE',
        `Booking is not active`,
      );
    }
    this.bookings.save({ ...booking, status: 'cancelled' });
  }

  cancelByGuest(id: string, token: string): void {
    const booking = this.bookings.findById(id);
    if (!booking || booking.status !== 'active') {
      throw DomainError.notFound('BOOKING_NOT_FOUND', `Booking '${id}' not found`);
    }
    if (booking.cancelToken !== token) {
      throw DomainError.forbidden(
        'INVALID_CANCEL_TOKEN',
        `Invalid cancel token`,
      );
    }
    this.bookings.save({ ...booking, status: 'cancelled' });
  }

  private toWithEvent(booking: Booking): BookingWithEventDto | null {
    const event = this.eventsRepo.findById(booking.eventId);
    if (!event) return null;
    return {
      id: booking.id,
      eventId: booking.eventId,
      startTime: booking.startTime,
      status: booking.status,
      guest: booking.guest,
      createdAt: booking.createdAt,
      event: toEventSummary(event),
    };
  }
}
