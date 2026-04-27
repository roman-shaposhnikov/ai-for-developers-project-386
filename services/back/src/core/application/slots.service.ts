import { Injectable } from '@nestjs/common';
import { ScheduleRepository } from '../../dal/schedule.repo';
import { BookingsRepository } from '../../dal/bookings.repo';
import { Event } from '../domain/event';
import { Slot } from '../domain/slot';
import { Booking } from '../domain/booking';
import { DomainError } from '../domain/errors';
import {
  WeeklySchedule,
  blockToMinutes,
  weekdayOfUtcDate,
} from '../domain/schedule';
import { Clock } from './clock';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BOOKING_WINDOW_DAYS = 14;

const parseDateUtc = (s: string): Date => {
  if (!DATE_RE.test(s)) {
    throw DomainError.validation(
      'INVALID_DATE',
      `Date must be in YYYY-MM-DD format`,
    );
  }
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw DomainError.validation('INVALID_DATE', `Invalid date '${s}'`);
  }
  return date;
};

const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );

const overlaps = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean => aStart < bEnd && bStart < aEnd;

export const computeSlots = (
  event: Event,
  schedule: WeeklySchedule,
  activeBookings: Booking[],
  dateIso: string,
  now: Date,
): Slot[] => {
  const date = parseDateUtc(dateIso);
  const todayStart = startOfUtcDay(now);
  const windowEnd = new Date(
    todayStart.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  if (date.getTime() < todayStart.getTime() || date.getTime() >= windowEnd.getTime()) {
    throw DomainError.validation(
      'OUT_OF_WINDOW',
      `Date must be within the ${BOOKING_WINDOW_DAYS}-day booking window`,
    );
  }

  const weekday = weekdayOfUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  const day = schedule.weekdays[weekday];
  if (!day || !day.enabled || day.blocks.length === 0) {
    return [];
  }

  const dayStartMs = date.getTime();
  const nowMs = now.getTime();
  const duration = event.duration;
  const slots: Slot[] = [];

  for (const block of day.blocks) {
    const { start, end } = blockToMinutes(block);
    for (let m = start; m + duration <= end; m += duration) {
      const startMs = dayStartMs + m * 60_000;
      const endMs = startMs + duration * 60_000;
      if (startMs <= nowMs) continue;

      const collides = activeBookings.some((b) => {
        const bStart = Date.parse(b.startTime);
        const bEnd = Date.parse(b.endTime);
        return overlaps(startMs, endMs, bStart, bEnd);
      });
      if (collides) continue;

      slots.push({
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
      });
    }
  }

  return slots;
};

@Injectable()
export class SlotsService {
  constructor(
    private readonly schedule: ScheduleRepository,
    private readonly bookings: BookingsRepository,
    private readonly clock: Clock,
  ) {}

  getForEvent(event: Event, dateIso: string): Slot[] {
    return computeSlots(
      event,
      this.schedule.get(),
      this.bookings.listActive(),
      dateIso,
      this.clock.now(),
    );
  }
}
