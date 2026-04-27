import { Injectable } from '@nestjs/common';
import {
  WeeklySchedule,
  emptyWeeklySchedule,
} from '../core/domain/schedule';

@Injectable()
export class ScheduleRepository {
  private current: WeeklySchedule = emptyWeeklySchedule();

  get(): WeeklySchedule {
    return this.current;
  }

  replace(next: WeeklySchedule): WeeklySchedule {
    this.current = next;
    return this.current;
  }
}
