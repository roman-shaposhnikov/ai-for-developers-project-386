import type { components } from '../../api';
import { dayjs } from './dayjs';

export type Weekday = keyof components['schemas']['Weekdays'];
export type DaySchedule = components['schemas']['DaySchedule'];
export type TimeBlock = components['schemas']['TimeBlock'];
export type Weekdays = components['schemas']['Weekdays'];

export const WEEKDAYS: readonly Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/**
 * Anchor week: ISO week starting Monday 2026-01-05. No DST jump in this week
 * for any common TZ, so local↔UTC offsets are stable across all 7 days.
 */
const ANCHOR_DATES: Record<Weekday, string> = {
  monday: '2026-01-05',
  tuesday: '2026-01-06',
  wednesday: '2026-01-07',
  thursday: '2026-01-08',
  friday: '2026-01-09',
  saturday: '2026-01-10',
  sunday: '2026-01-11',
};

const WEEKDAY_BY_ISO: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const HHMM_RE = /^([01]\d|2[0-3]):[0-5][05]$/;
const MAX_END = '23:55';

export function isHhMm(s: string): boolean {
  return HHMM_RE.test(s);
}

export function emptyWeekdays(): Weekdays {
  const result = {} as Weekdays;
  for (const wd of WEEKDAYS) {
    result[wd] = { enabled: false, blocks: [] };
  }
  return result;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function toHhMm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type DirectedBlock = { weekday: Weekday; start: string; end: string };

function shiftBlock(
  weekday: Weekday,
  block: TimeBlock,
  fromTz: string,
  toTz: string,
): DirectedBlock[] {
  const startLocal = dayjs.tz(`${ANCHOR_DATES[weekday]} ${block.start}`, fromTz);
  const endLocal = dayjs.tz(`${ANCHOR_DATES[weekday]} ${block.end}`, fromTz);

  const startTarget = startLocal.tz(toTz);
  const endTarget = endLocal.tz(toTz);

  const startWd = WEEKDAY_BY_ISO[startTarget.day()];
  const endWd = WEEKDAY_BY_ISO[endTarget.day()];

  const startHhMm = startTarget.format('HH:mm');
  const endHhMm = endTarget.format('HH:mm');

  if (startWd === endWd) {
    return [{ weekday: startWd, start: startHhMm, end: endHhMm }];
  }

  // Block crosses midnight in target TZ — split into two pieces. Contract caps
  // end at 23:55, so we lose the final 5 minutes on the rollover day.
  const pieces: DirectedBlock[] = [];
  if (toMinutes(startHhMm) < toMinutes(MAX_END)) {
    pieces.push({ weekday: startWd, start: startHhMm, end: MAX_END });
  }
  if (toMinutes(endHhMm) > 0) {
    pieces.push({ weekday: endWd, start: '00:00', end: endHhMm });
  }
  return pieces;
}

function mergeAdjacent(blocks: TimeBlock[]): TimeBlock[] {
  if (blocks.length === 0) return blocks;
  const sorted = [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  const out: TimeBlock[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1];
    const cur = sorted[i];
    if (toMinutes(cur.start) <= toMinutes(last.end)) {
      last.end = toHhMm(Math.max(toMinutes(last.end), toMinutes(cur.end)));
    } else {
      out.push(cur);
    }
  }
  return out;
}

function convertWeekdays(weekdays: Weekdays, fromTz: string, toTz: string): Weekdays {
  const target = emptyWeekdays();

  for (const wd of WEEKDAYS) {
    const day = weekdays[wd];
    if (!day.enabled) continue;
    for (const block of day.blocks) {
      for (const piece of shiftBlock(wd, block, fromTz, toTz)) {
        target[piece.weekday].blocks.push({ start: piece.start, end: piece.end });
      }
    }
  }

  for (const wd of WEEKDAYS) {
    target[wd].blocks = mergeAdjacent(target[wd].blocks);
    // A weekday is enabled in the target if either (a) some pieces landed
    // there, or (b) the source weekday was enabled with no blocks (user marked
    // the day open but hasn't added blocks yet).
    const sourceEnabledEmpty = weekdays[wd].enabled && weekdays[wd].blocks.length === 0;
    target[wd].enabled = target[wd].blocks.length > 0 || sourceEnabledEmpty;
  }

  return target;
}

export function localBlocksToUtc(weekdays: Weekdays, tz: string): Weekdays {
  return convertWeekdays(weekdays, tz, 'UTC');
}

export function utcBlocksToLocal(weekdays: Weekdays, tz: string): Weekdays {
  return convertWeekdays(weekdays, 'UTC', tz);
}
