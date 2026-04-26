import { describe, it, expect } from 'vitest';
import { addBlock, removeBlock, setDayEnabled, updateBlock, validateWeek } from './model';
import { emptyWeekdays } from '@/shared/lib/time';

describe('week-schedule-editor model', () => {
  it('flags overlapping blocks', () => {
    const week = { ...emptyWeekdays() };
    week.monday = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '12:00' },
        { start: '11:00', end: '13:00' },
      ],
    };
    const v = validateWeek(week);
    expect(v.valid).toBe(false);
    expect(v.errors.monday).toBeTruthy();
  });

  it('accepts non-overlapping blocks', () => {
    const week = { ...emptyWeekdays() };
    week.tuesday = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' },
      ],
    };
    expect(validateWeek(week).valid).toBe(true);
  });

  it('rejects end-before-start', () => {
    const week = { ...emptyWeekdays() };
    week.monday = { enabled: true, blocks: [{ start: '17:00', end: '09:00' }] };
    expect(validateWeek(week).valid).toBe(false);
  });

  it('addBlock appends a new range and enables the day', () => {
    const w0 = setDayEnabled(emptyWeekdays(), 'monday', true);
    const w1 = addBlock(w0, 'monday');
    expect(w1.monday.blocks.length).toBe(2);
    expect(w1.monday.enabled).toBe(true);
  });

  it('removeBlock drops the entry and disables the day if empty', () => {
    const w0 = setDayEnabled(emptyWeekdays(), 'monday', true);
    const w1 = removeBlock(w0, 'monday', 0);
    expect(w1.monday.blocks).toEqual([]);
    expect(w1.monday.enabled).toBe(false);
  });

  it('updateBlock replaces a single field', () => {
    const w0 = setDayEnabled(emptyWeekdays(), 'monday', true);
    const w1 = updateBlock(w0, 'monday', 0, { end: '18:00' });
    expect(w1.monday.blocks[0]).toEqual({ start: '09:00', end: '18:00' });
  });
});
