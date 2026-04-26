import type { TimeBlock, Weekday, Weekdays } from './types';
import { WEEKDAYS } from '@/shared/lib/time';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function validateWeek(week: Weekdays): { valid: boolean; errors: Partial<Record<Weekday, string>> } {
  const errors: Partial<Record<Weekday, string>> = {};
  for (const wd of WEEKDAYS) {
    const day = week[wd];
    if (!day.enabled) continue;
    if (day.blocks.length === 0) continue;
    const sorted = [...day.blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    for (const b of sorted) {
      if (toMinutes(b.start) >= toMinutes(b.end)) {
        errors[wd] = 'End must be after start.';
        break;
      }
    }
    if (errors[wd]) continue;
    for (let i = 1; i < sorted.length; i++) {
      if (toMinutes(sorted[i].start) < toMinutes(sorted[i - 1].end)) {
        errors[wd] = 'Time blocks must not overlap.';
        break;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function defaultBlock(): TimeBlock {
  return { start: '09:00', end: '17:00' };
}

export function setDayEnabled(week: Weekdays, wd: Weekday, enabled: boolean): Weekdays {
  const next: Weekdays = { ...week, [wd]: { ...week[wd], enabled } };
  if (enabled && next[wd].blocks.length === 0) {
    next[wd].blocks = [defaultBlock()];
  }
  return next;
}

export function addBlock(week: Weekdays, wd: Weekday): Weekdays {
  const day = week[wd];
  const last = day.blocks[day.blocks.length - 1];
  const nextStart = last ? last.end : '09:00';
  const nextStartMin = toMinutes(nextStart);
  const newBlock: TimeBlock = {
    start: nextStart,
    end: minutesToHhMm(Math.min(nextStartMin + 60, 23 * 60 + 55)),
  };
  return {
    ...week,
    [wd]: { ...day, enabled: true, blocks: [...day.blocks, newBlock] },
  };
}

export function removeBlock(week: Weekdays, wd: Weekday, index: number): Weekdays {
  const day = week[wd];
  const blocks = day.blocks.filter((_, i) => i !== index);
  return { ...week, [wd]: { ...day, blocks, enabled: blocks.length > 0 ? day.enabled : false } };
}

export function updateBlock(
  week: Weekdays,
  wd: Weekday,
  index: number,
  patch: Partial<TimeBlock>,
): Weekdays {
  const day = week[wd];
  const blocks = day.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b));
  return { ...week, [wd]: { ...day, blocks } };
}

export function copyBlocksToOtherDays(week: Weekdays, source: Weekday): Weekdays {
  const blocks = week[source].blocks.map((b) => ({ ...b }));
  const next = { ...week };
  for (const wd of WEEKDAYS) {
    if (wd === source) continue;
    next[wd] = { enabled: blocks.length > 0, blocks: blocks.map((b) => ({ ...b })) };
  }
  return next;
}

function minutesToHhMm(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
