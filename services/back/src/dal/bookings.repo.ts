import { Injectable } from '@nestjs/common';
import { Booking } from '../core/domain/booking';

@Injectable()
export class BookingsRepository {
  private readonly byId = new Map<string, Booking>();

  list(): Booking[] {
    return Array.from(this.byId.values());
  }

  findById(id: string): Booking | undefined {
    return this.byId.get(id);
  }

  listActiveUpcoming(nowIso: string): Booking[] {
    return this.list()
      .filter((b) => b.status === 'active' && b.startTime >= nowIso)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  listActiveByEventId(eventId: string): Booking[] {
    return this.list().filter(
      (b) => b.eventId === eventId && b.status === 'active',
    );
  }

  listActive(): Booking[] {
    return this.list().filter((b) => b.status === 'active');
  }

  save(booking: Booking): void {
    this.byId.set(booking.id, booking);
  }
}
