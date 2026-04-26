import { describe, it, expect } from 'vitest';
import {
  emptyWeekdays,
  localBlocksToUtc,
  utcBlocksToLocal,
  type Weekdays,
} from './weekday';

function week(overrides: Partial<Weekdays>): Weekdays {
  return { ...emptyWeekdays(), ...overrides };
}

describe('weekday conversions', () => {
  it('shifts same-day block from Moscow (+3) to UTC', () => {
    const local = week({
      monday: { enabled: true, blocks: [{ start: '09:00', end: '17:00' }] },
    });
    const utc = localBlocksToUtc(local, 'Europe/Moscow');
    expect(utc.monday).toEqual({ enabled: true, blocks: [{ start: '06:00', end: '14:00' }] });
  });

  it('round-trips Moscow → UTC → Moscow', () => {
    const local = week({
      tuesday: { enabled: true, blocks: [{ start: '10:00', end: '12:00' }] },
      wednesday: { enabled: true, blocks: [{ start: '09:00', end: '13:00' }] },
    });
    const utc = localBlocksToUtc(local, 'Europe/Moscow');
    const back = utcBlocksToLocal(utc, 'Europe/Moscow');
    expect(back.tuesday).toEqual(local.tuesday);
    expect(back.wednesday).toEqual(local.wednesday);
  });

  it('splits a block crossing midnight in target TZ', () => {
    // Moscow Mon 23:00–24:00 (display) — but our pattern caps at 23:55,
    // so use Mon 22:00–02:00 which becomes UTC Mon 19:00–23:00 (no split).
    // To force a split: Auckland (+12 in Jan, no DST mid-Jan-2026) Mon 09:00–11:00
    // → UTC Sun 21:00–23:00 (no split). Use UTC base that crosses local midnight:
    const utc = week({
      monday: { enabled: true, blocks: [{ start: '21:00', end: '23:00' }] },
    });
    // UTC Mon 21:00–23:00 → Asia/Tokyo (+9): Tue 06:00–08:00 (no split, full shift).
    const tokyo = utcBlocksToLocal(utc, 'Asia/Tokyo');
    expect(tokyo.tuesday).toEqual({ enabled: true, blocks: [{ start: '06:00', end: '08:00' }] });
    expect(tokyo.monday).toEqual({ enabled: false, blocks: [] });
  });

  it('splits when block straddles UTC midnight', () => {
    // Moscow (+3) Tue 23:00 → 24:00 isn't representable; use 22:00–01:00 which
    // becomes UTC Tue 19:00–22:00 (single block, no split). Force split with:
    // Tue 02:00 (Moscow) → UTC Mon 23:00. So a Moscow Tue 02:00–04:00 block →
    // UTC Mon 23:00–01:00 which splits across Mon/Tue UTC midnight.
    const local = week({
      tuesday: { enabled: true, blocks: [{ start: '02:00', end: '04:00' }] },
    });
    const utc = localBlocksToUtc(local, 'Europe/Moscow');
    expect(utc.monday.enabled).toBe(true);
    expect(utc.monday.blocks[0].start).toBe('23:00');
    expect(utc.tuesday.enabled).toBe(true);
    expect(utc.tuesday.blocks[0].start).toBe('00:00');
    expect(utc.tuesday.blocks[0].end).toBe('01:00');
  });

  it('preserves enabled-but-empty days', () => {
    const local = week({
      monday: { enabled: true, blocks: [] },
    });
    const utc = localBlocksToUtc(local, 'UTC');
    expect(utc.monday.enabled).toBe(true);
    expect(utc.monday.blocks).toEqual([]);
  });
});
