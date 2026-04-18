import { Module } from '@nestjs/common';
import { StorageModule } from './storage/storage.module';
import { EventsModule } from './events/events.module';
import { PublicEventsModule } from './public-events/public-events.module';
import { BookingsModule } from './bookings/bookings.module';
import { PublicBookingsModule } from './public-bookings/public-bookings.module';
import { ScheduleModule } from './schedule/schedule.module';

@Module({
  imports: [
    StorageModule,
    EventsModule,
    PublicEventsModule,
    BookingsModule,
    PublicBookingsModule,
    ScheduleModule,
  ],
})
export class AppModule {}
