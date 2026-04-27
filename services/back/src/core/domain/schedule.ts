import { DomainError } from './errors';

export interface TimeBlock {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  blocks: TimeBlock[];
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export type Weekdays = Record<Weekday, DaySchedule>;

export interface WeeklySchedule {
  weekdays: Weekdays;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5][05]$/;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const blockToMinutes = (block: TimeBlock): { start: number; end: number } => ({
  start: toMinutes(block.start),
  end: toMinutes(block.end),
});

const validateBlock = (block: TimeBlock, dayName: string): void => {
  if (!TIME_RE.test(block.start) || !TIME_RE.test(block.end)) {
    throw DomainError.validation(
      'INVALID_TIME_BLOCK',
      `${dayName}: time must match HH:MM with 5-minute granularity`,
    );
  }
  if (toMinutes(block.end) <= toMinutes(block.start)) {
    throw DomainError.validation(
      'INVALID_TIME_BLOCK',
      `${dayName}: block end must be after start`,
    );
  }
};

const validateDay = (day: DaySchedule, dayName: string): void => {
  for (const block of day.blocks) {
    validateBlock(block, dayName);
  }
  const sorted = [...day.blocks]
    .map((b) => blockToMinutes(b))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].end) {
      throw DomainError.validation(
        'OVERLAPPING_BLOCKS',
        `${dayName}: time blocks must not overlap`,
      );
    }
  }
};

export const validateWeeklySchedule = (schedule: WeeklySchedule): void => {
  for (const day of WEEKDAYS) {
    const ds = schedule.weekdays[day];
    if (!ds) {
      throw DomainError.validation(
        'MISSING_DAY',
        `Schedule must define every weekday (missing: ${day})`,
      );
    }
    validateDay(ds, day);
  }
};

export const emptyWeeklySchedule = (): WeeklySchedule => ({
  weekdays: WEEKDAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, blocks: [] };
    return acc;
  }, {} as Weekdays),
});

export const weekdayOfUtcDate = (year: number, month: number, day: number): Weekday => {
  // month is 1-12
  const date = new Date(Date.UTC(year, month - 1, day));
  // getUTCDay: 0=Sunday..6=Saturday
  const map: Weekday[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return map[date.getUTCDay()];
};
