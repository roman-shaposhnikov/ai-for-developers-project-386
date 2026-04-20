import { Controller, Get, Put, Body } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { WeeklyScheduleDto } from './dto/weekly-schedule.dto';
import { WeeklySchedule } from '../storage/entities/schedule.entity';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  getSchedule(): WeeklySchedule {
    return this.scheduleService.getSchedule();
  }

  @Put()
  updateSchedule(@Body() dto: WeeklyScheduleDto): WeeklySchedule {
    return this.scheduleService.updateSchedule(dto);
  }
}
