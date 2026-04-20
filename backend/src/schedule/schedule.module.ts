import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
