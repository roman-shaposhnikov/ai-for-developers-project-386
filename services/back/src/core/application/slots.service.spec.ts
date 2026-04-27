import { computeSlots } from './slots.service';
import { Event } from '../domain/event';
import { Booking } from '../domain/booking';
import { emptyWeeklySchedule, WeeklySchedule } from '../domain/schedule';

const event = (duration: number): Event => ({
  id: 'e1',
  title: 'T',
  description: 'D',
  duration,
  slug: 'intro',
  active: true,
  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
});

const monSchedule = (
  blocks: { start: string; end: string }[],
): WeeklySchedule => {
  const sched = emptyWeeklySchedule();
  sched.weekdays.monday = { enabled: true, blocks };
  return sched;
};

// 2026-04-27 — Monday UTC; "now" set to that Monday at 00:00:00 UTC.
const now = new Date(Date.UTC(2026, 3, 27, 0, 0, 0));
const monday = '2026-04-27';

describe('computeSlots', () => {
  it('returns slots stepped by event duration within a block', () => {
    const slots = computeSlots(
      event(30),
      monSchedule([{ start: '09:00', end: '11:00' }]),
      [],
      monday,
      now,
    );
    expect(slots.map((s) => s.startTime.slice(11, 16))).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
    ]);
  });

  it('stops emitting before the block end if duration does not fit', () => {
    const slots = computeSlots(
      event(60),
      monSchedule([{ start: '09:00', end: '10:30' }]),
      [],
      monday,
      now,
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime.endsWith('09:00:00.000Z')).toBe(true);
  });

  it('skips slots overlapping with active bookings (any event)', () => {
    const occupied: Booking = {
      id: 'b1',
      eventId: 'other-event',
      startTime: '2026-04-27T09:30:00.000Z',
      endTime: '2026-04-27T10:00:00.000Z',
      status: 'active',
      guest: { name: 'G', email: 'g@e.x' },
      createdAt: '2026-04-26T00:00:00.000Z',
      cancelToken: 'tok',
    };
    const slots = computeSlots(
      event(30),
      monSchedule([{ start: '09:00', end: '11:00' }]),
      [occupied],
      monday,
      now,
    );
    const times = slots.map((s) => s.startTime.slice(11, 16));
    expect(times).toEqual(['09:00', '10:00', '10:30']);
  });

  it('returns empty list when day is disabled', () => {
    const sched = emptyWeeklySchedule();
    const slots = computeSlots(event(30), sched, [], monday, now);
    expect(slots).toEqual([]);
  });

  it('rejects dates outside the 14-day window', () => {
    expect(() =>
      computeSlots(event(30), monSchedule([{ start: '09:00', end: '10:00' }]), [], '2026-04-26', now),
    ).toThrow(/window/);
    expect(() =>
      computeSlots(event(30), monSchedule([{ start: '09:00', end: '10:00' }]), [], '2026-05-11', now),
    ).toThrow(/window/);
  });

  it('rejects bad date format', () => {
    expect(() =>
      computeSlots(event(30), monSchedule([{ start: '09:00', end: '10:00' }]), [], '2026/04/27', now),
    ).toThrow(/YYYY-MM-DD/);
  });

  it('skips slots whose start has already passed today', () => {
    const todayNow = new Date(Date.UTC(2026, 3, 27, 9, 30, 0));
    const slots = computeSlots(
      event(30),
      monSchedule([{ start: '09:00', end: '11:00' }]),
      [],
      monday,
      todayNow,
    );
    expect(slots.map((s) => s.startTime.slice(11, 16))).toEqual([
      '10:00',
      '10:30',
    ]);
  });
});
