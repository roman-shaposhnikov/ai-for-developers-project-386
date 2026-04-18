export interface TimeBlock {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  blocks: TimeBlock[];
}

export interface Weekdays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface WeeklySchedule {
  weekdays: Weekdays;
}
