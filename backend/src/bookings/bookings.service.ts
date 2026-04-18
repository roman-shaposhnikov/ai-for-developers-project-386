import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { BookingWithEvent } from '../storage/entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(private readonly storage: StorageService) {}

  findAll(): BookingWithEvent[] {
    const now = new Date().toISOString();
    const bookings = this.storage.findAllBookings()
      .filter(b => b.status === 'active' && b.startTime >= now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return bookings.map(booking => {
      const event = this.storage.findEventById(booking.eventId);
      return {
        ...booking,
        event: event ? {
          title: event.title,
          slug: event.slug,
          duration: event.duration,
        } : {
          title: 'Unknown',
          slug: 'unknown',
          duration: 0,
        },
      };
    });
  }

  findById(id: string): BookingWithEvent {
    const booking = this.storage.findBookingById(id);
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      });
    }

    const event = this.storage.findEventById(booking.eventId);
    return {
      ...booking,
      event: event ? {
        title: event.title,
        slug: event.slug,
        duration: event.duration,
      } : {
        title: 'Unknown',
        slug: 'unknown',
        duration: 0,
      },
    };
  }

  cancel(id: string): void {
    const booking = this.storage.findBookingById(id);
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      });
    }

    if (booking.status === 'cancelled') {
      throw new ConflictException({
        code: 'ALREADY_CANCELLED',
        message: 'Booking is already cancelled',
      });
    }

    this.storage.updateBooking(id, { status: 'cancelled' });
  }
}
