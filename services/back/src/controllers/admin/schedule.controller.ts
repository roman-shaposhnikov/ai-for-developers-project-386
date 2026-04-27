import { Body, Controller, Get, Put } from '@nestjs/common';
import { ScheduleService } from '../../core/application/schedule.service';
import { WeeklyScheduleDto } from '../dto/weekly-schedule.dto';
import { WeeklySchedule } from '../../core/domain/schedule';

@Controller('schedule')
export class AdminScheduleController {
  constructor(private readonly schedule: ScheduleService) {}

  @Get()
  get(): WeeklySchedule {
    return this.schedule.get();
  }

  @Put()
  replace(@Body() body: WeeklyScheduleDto): WeeklySchedule {
    return this.schedule.replace(body);
  }
}
