import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { Event } from '../storage/entities/event.entity';
import { Slot, SlotsResponse } from '../storage/entities/slot.entity';
import { Booking, BookingWithEvent } from '../storage/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PublicEventsService {
  constructor(private readonly storage: StorageService) {}

  findAllActive(): Event[] {
    return this.storage.findAllEvents().filter(e => e.active);
  }

  findActiveBySlug(slug: string): Event {
    const event = this.storage.findEventBySlug(slug);
    if (!event || !event.active) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }
    return event;
  }

  getSlots(slug: string, dateStr: string): SlotsResponse {
    const event = this.findActiveBySlug(slug);
    
    // Validate date format and range
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Date must be in YYYY-MM-DD format',
      });
    }

    const requestedDate = new Date(dateStr + 'T00:00:00Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 14);

    if (requestedDate < today || requestedDate > maxDate) {
      throw new BadRequestException({
        code: 'DATE_OUT_OF_RANGE',
        message: 'Date must be within 14 days from today',
      });
    }

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayOfWeek = dayNames[requestedDate.getUTCDay()];
    
    // Get schedule for this day
    const schedule = this.storage.getSchedule();
    const daySchedule = schedule.weekdays[dayOfWeek];

    if (!daySchedule.enabled || daySchedule.blocks.length === 0) {
      return {
        date: dateStr,
        eventSlug: slug,
        duration: event.duration,
        slots: [],
      };
    }

    // Generate slots
    const slots: Slot[] = [];
    const duration = event.duration;

    for (const block of daySchedule.blocks) {
      const blockStart = this.parseTime(block.start);
      const blockEnd = this.parseTime(block.end);

      let currentMinutes = blockStart;
      while (currentMinutes + duration <= blockEnd) {
        const slotStart = this.formatDateTime(requestedDate, currentMinutes);
        const slotEnd = this.formatDateTime(requestedDate, currentMinutes + duration);

        // Check if slot is in the past (for today)
        const slotStartDate = new Date(slotStart);
        const now = new Date();
        if (requestedDate.getTime() === today.getTime() && slotStartDate <= now) {
          currentMinutes += duration;
          continue;
        }

        // Check conflicts with active bookings
        const hasConflict = this.hasBookingConflict(slotStart, slotEnd);

        if (!hasConflict) {
          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
          });
        }

        currentMinutes += duration;
      }
    }

    return {
      date: dateStr,
      eventSlug: slug,
      duration: event.duration,
      slots,
    };
  }

  createBooking(slug: string, dto: CreateBookingDto): BookingWithEvent {
    const event = this.findActiveBySlug(slug);
    
    // Validate startTime format
    const startTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (!startTimeRegex.test(dto.startTime)) {
      throw new BadRequestException({
        code: 'INVALID_SLOT_TIME',
        message: 'startTime must be in ISO 8601 UTC format (YYYY-MM-DDTHH:MM:SSZ)',
      });
    }

    // Check if slot is available
    const startDate = new Date(dto.startTime);
    const dateStr = dto.startTime.split('T')[0];
    const slotsResponse = this.getSlots(slug, dateStr);
    
    const slotExists = slotsResponse.slots.some(
      slot => slot.startTime === dto.startTime
    );

    if (!slotExists) {
      throw new ConflictException({
        code: 'SLOT_UNAVAILABLE',
        message: 'The requested time slot is no longer available',
      });
    }

    // Create booking
    const now = new Date().toISOString();
    const booking: Booking = {
      id: uuidv4(),
      eventId: event.id,
      startTime: dto.startTime,
      status: 'active',
      cancelToken: uuidv4(),
      guest: {
        name: dto.guest.name,
        email: dto.guest.email,
        notes: dto.guest.notes,
      },
      createdAt: now,
    };

    this.storage.createBooking(booking);

    return {
      ...booking,
      event: {
        title: event.title,
        slug: event.slug,
        duration: event.duration,
      },
    };
  }

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatDateTime(date: Date, minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00Z`;
  }

  private hasBookingConflict(slotStart: string, slotEnd: string): boolean {
    const activeBookings = this.storage.findAllBookings().filter(b => b.status === 'active');
    
    const slotStartTime = new Date(slotStart).getTime();
    const slotEndTime = new Date(slotEnd).getTime();

    return activeBookings.some(booking => {
      const event = this.storage.findEventById(booking.eventId);
      if (!event) return false;

      const bookingStart = new Date(booking.startTime).getTime();
      const bookingEnd = bookingStart + event.duration * 60000;

      // Check overlap: [slotStart, slotEnd) overlaps with [bookingStart, bookingEnd)
      return slotStartTime < bookingEnd && slotEndTime > bookingStart;
    });
  }
}
