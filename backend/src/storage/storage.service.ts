import { Injectable } from '@nestjs/common';
import { Event } from './entities/event.entity';
import { Booking, BookingWithEvent } from './entities/booking.entity';
import { WeeklySchedule } from './entities/schedule.entity';

@Injectable()
export class StorageService {
  private events: Map<string, Event> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private schedule: WeeklySchedule = {
    weekdays: {
      monday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
      friday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
      saturday: { enabled: false, blocks: [] },
      sunday: { enabled: false, blocks: [] },
    },
  };

  // Events
  findAllEvents(): Event[] {
    return Array.from(this.events.values());
  }

  findEventBySlug(slug: string): Event | undefined {
    return this.events.get(slug);
  }

  findEventById(id: string): Event | undefined {
    return Array.from(this.events.values()).find(e => e.id === id);
  }

  createEvent(event: Event): Event {
    this.events.set(event.slug, event);
    return event;
  }

  updateEvent(slug: string, updates: Partial<Event>): Event | undefined {
    const event = this.events.get(slug);
    if (!event) return undefined;
    
    const updated = { ...event, ...updates, updatedAt: new Date().toISOString() };
    this.events.set(slug, updated);
    return updated;
  }

  deleteEvent(slug: string): boolean {
    return this.events.delete(slug);
  }

  slugExists(slug: string): boolean {
    return this.events.has(slug);
  }

  // Bookings
  findAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  findBookingById(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  createBooking(booking: Booking): Booking {
    this.bookings.set(booking.id, booking);
    return booking;
  }

  updateBooking(id: string, updates: Partial<Booking>): Booking | undefined {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updated = { ...booking, ...updates };
    this.bookings.set(id, updated);
    return updated;
  }

  hasActiveBookingsForEvent(eventId: string): boolean {
    return Array.from(this.bookings.values()).some(
      b => b.eventId === eventId && b.status === 'active'
    );
  }

  // Schedule
  getSchedule(): WeeklySchedule {
    return this.schedule;
  }

  updateSchedule(schedule: WeeklySchedule): WeeklySchedule {
    this.schedule = schedule;
    return this.schedule;
  }
}
