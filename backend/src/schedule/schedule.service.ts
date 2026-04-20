import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { WeeklySchedule } from '../storage/entities/schedule.entity';
import { WeeklyScheduleDto } from './dto/weekly-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private readonly storage: StorageService) {}

  getSchedule(): WeeklySchedule {
    return this.storage.getSchedule();
  }

  updateSchedule(dto: WeeklyScheduleDto): WeeklySchedule {
    this.validateSchedule(dto);
    return this.storage.updateSchedule(dto as WeeklySchedule);
  }

  private validateSchedule(dto: WeeklyScheduleDto): void {
    const weekdays = dto.weekdays;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    
    for (const day of days) {
      const daySchedule = weekdays[day];
      if (!daySchedule.enabled || daySchedule.blocks.length === 0) {
        continue;
      }

      // Check for overlapping blocks
      const sortedBlocks = [...daySchedule.blocks].sort((a, b) => 
        this.timeToMinutes(a.start) - this.timeToMinutes(b.start)
      );

      for (let i = 0; i < sortedBlocks.length; i++) {
        const block = sortedBlocks[i];
        const startMinutes = this.timeToMinutes(block.start);
        const endMinutes = this.timeToMinutes(block.end);

        if (startMinutes >= endMinutes) {
          throw new BadRequestException({
            code: 'INVALID_SCHEDULE',
            message: `Invalid schedule for ${day}: start time must be before end time`,
          });
        }

        if (i > 0) {
          const prevBlock = sortedBlocks[i - 1];
          const prevEndMinutes = this.timeToMinutes(prevBlock.end);
          
          if (startMinutes < prevEndMinutes) {
            throw new BadRequestException({
              code: 'INVALID_SCHEDULE',
              message: `Invalid schedule for ${day}: time blocks must not overlap`,
            });
          }
        }
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}
