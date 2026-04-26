import { describe, it, expect } from 'vitest';
import { formatSlot, formatSlotRange, toDateParam } from './format';

describe('time formatting', () => {
  it('formats UTC ISO to local HH:mm', () => {
    expect(formatSlot('2026-04-14T06:00:00Z', 'Europe/Moscow')).toBe('09:00');
    expect(formatSlot('2026-04-14T06:00:00Z', 'UTC')).toBe('06:00');
  });

  it('formats slot range with duration', () => {
    expect(formatSlotRange('2026-04-14T06:00:00Z', 30, 'Europe/Moscow')).toBe('09:00–09:30');
  });

  it('converts a Date to YYYY-MM-DD in the supplied tz', () => {
    // 2026-04-14 23:30 UTC = 2026-04-15 02:30 in Moscow
    const d = new Date('2026-04-14T23:30:00Z');
    expect(toDateParam(d, 'Europe/Moscow')).toBe('2026-04-15');
    expect(toDateParam(d, 'UTC')).toBe('2026-04-14');
  });
});
