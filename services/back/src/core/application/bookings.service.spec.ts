import { BookingsService } from './bookings.service';
import { EventsService } from './events.service';
import { EventsRepository } from '../../dal/events.repo';
import { BookingsRepository } from '../../dal/bookings.repo';
import { ScheduleRepository } from '../../dal/schedule.repo';
import { DomainError } from '../domain/errors';
import { emptyWeeklySchedule } from '../domain/schedule';
import { Clock } from './clock';

const fixedClock = (iso: string): Clock => ({
  now: () => new Date(iso),
}) as Clock;

const setup = () => {
  const eventsRepo = new EventsRepository();
  const bookingsRepo = new BookingsRepository();
  const scheduleRepo = new ScheduleRepository();
  const events = new EventsService(eventsRepo, bookingsRepo);
  // Monday 09:00–11:00 UTC enabled.
  const sched = emptyWeeklySchedule();
  sched.weekdays.monday = {
    enabled: true,
    blocks: [{ start: '09:00', end: '11:00' }],
  };
  scheduleRepo.replace(sched);
  const event = events.create({
    title: 'Intro',
    description: 'd',
    duration: 30,
    slug: 'intro',
  });
  const clock = fixedClock('2026-04-27T08:00:00.000Z'); // Monday morning
  const bookings = new BookingsService(
    bookingsRepo,
    scheduleRepo,
    events,
    eventsRepo,
    clock,
  );
  return { bookings, bookingsRepo, eventsRepo, event, scheduleRepo };
};

describe('BookingsService', () => {
  it('books a valid slot and returns cancel token', () => {
    const { bookings } = setup();
    const created = bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'G', email: 'g@e.x' },
    });
    expect(created.status).toBe('active');
    expect(created.cancelToken).toBeTruthy();
    expect(created.endTime).toBe('2026-04-27T09:30:00.000Z');
  });

  it('rejects double-booking same slot (409)', () => {
    const { bookings } = setup();
    bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'G', email: 'g@e.x' },
    });
    expect(() =>
      bookings.create('intro', {
        startTime: '2026-04-27T09:00:00.000Z',
        guest: { name: 'X', email: 'x@e.x' },
      }),
    ).toThrow(/slot is not available/);
  });

  it('rejects slots not aligned with the schedule', () => {
    const { bookings } = setup();
    expect(() =>
      bookings.create('intro', {
        startTime: '2026-04-27T08:30:00.000Z',
        guest: { name: 'G', email: 'g@e.x' },
      }),
    ).toThrow(DomainError);
  });

  it('cancelByGuest with wrong token → 403', () => {
    const { bookings } = setup();
    const created = bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'G', email: 'g@e.x' },
    });
    expect(() => bookings.cancelByGuest(created.id, 'nope')).toThrow(
      /token/,
    );
  });

  it('cancelByGuest with right token marks as cancelled', () => {
    const { bookings, bookingsRepo } = setup();
    const created = bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'G', email: 'g@e.x' },
    });
    bookings.cancelByGuest(created.id, created.cancelToken);
    expect(bookingsRepo.findById(created.id)?.status).toBe('cancelled');
  });

  it('cancelByOwner double-cancel → 409', () => {
    const { bookings } = setup();
    const created = bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'G', email: 'g@e.x' },
    });
    bookings.cancelByOwner(created.id);
    expect(() => bookings.cancelByOwner(created.id)).toThrow(/active/);
  });

  it('listUpcoming returns active future bookings sorted by startTime', () => {
    const { bookings } = setup();
    bookings.create('intro', {
      startTime: '2026-04-27T10:00:00.000Z',
      guest: { name: 'A', email: 'a@e.x' },
    });
    bookings.create('intro', {
      startTime: '2026-04-27T09:00:00.000Z',
      guest: { name: 'B', email: 'b@e.x' },
    });
    const list = bookings.listUpcoming();
    expect(list.map((b) => b.startTime)).toEqual([
      '2026-04-27T09:00:00.000Z',
      '2026-04-27T10:00:00.000Z',
    ]);
  });
});
