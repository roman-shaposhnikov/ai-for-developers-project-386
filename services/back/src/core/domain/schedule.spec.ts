import {
  validateWeeklySchedule,
  emptyWeeklySchedule,
  weekdayOfUtcDate,
} from './schedule';
import { DomainError } from './errors';

describe('validateWeeklySchedule', () => {
  it('accepts an empty default schedule', () => {
    expect(() => validateWeeklySchedule(emptyWeeklySchedule())).not.toThrow();
  });

  it('rejects end <= start', () => {
    const bad = emptyWeeklySchedule();
    bad.weekdays.monday = {
      enabled: true,
      blocks: [{ start: '12:00', end: '12:00' }],
    };
    expect(() => validateWeeklySchedule(bad)).toThrow(DomainError);
  });

  it('rejects bad HH:MM format (1-min granularity)', () => {
    const bad = emptyWeeklySchedule();
    bad.weekdays.tuesday = {
      enabled: true,
      blocks: [{ start: '09:03', end: '12:00' }],
    };
    expect(() => validateWeeklySchedule(bad)).toThrow(/HH:MM/);
  });

  it('rejects overlapping blocks within a day', () => {
    const bad = emptyWeeklySchedule();
    bad.weekdays.wednesday = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '14:00' },
      ],
    };
    expect(() => validateWeeklySchedule(bad)).toThrow(/overlap/);
  });

  it('accepts adjacent (non-overlapping) blocks', () => {
    const ok = emptyWeeklySchedule();
    ok.weekdays.thursday = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '12:00' },
        { start: '12:00', end: '14:00' },
      ],
    };
    expect(() => validateWeeklySchedule(ok)).not.toThrow();
  });
});

describe('weekdayOfUtcDate', () => {
  it('returns the correct weekday', () => {
    // 2026-04-27 is a Monday (UTC).
    expect(weekdayOfUtcDate(2026, 4, 27)).toBe('monday');
    expect(weekdayOfUtcDate(2026, 5, 3)).toBe('sunday');
  });
});
