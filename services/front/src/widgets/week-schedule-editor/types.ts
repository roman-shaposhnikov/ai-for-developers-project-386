import type { TimeBlock, Weekday, Weekdays } from '@/shared/lib/time';

export type LocalWeek = Weekdays;

export interface WeekValidation {
  valid: boolean;
  errors: Partial<Record<Weekday, string>>;
}

export type { TimeBlock, Weekday, Weekdays };
