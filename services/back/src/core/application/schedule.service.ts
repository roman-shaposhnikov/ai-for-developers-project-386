import { Injectable } from '@nestjs/common';
import { ScheduleRepository } from '../../dal/schedule.repo';
import {
  WeeklySchedule,
  validateWeeklySchedule,
} from '../domain/schedule';

@Injectable()
export class ScheduleService {
  constructor(private readonly repo: ScheduleRepository) {}

  get(): WeeklySchedule {
    return this.repo.get();
  }

  replace(next: WeeklySchedule): WeeklySchedule {
    validateWeeklySchedule(next);
    return this.repo.replace(next);
  }
}
