import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { EventsRepository } from './dal/events.repo';
import { BookingsRepository } from './dal/bookings.repo';
import { ScheduleRepository } from './dal/schedule.repo';
import { EventsService } from './core/application/events.service';
import { ScheduleService } from './core/application/schedule.service';
import { SlotsService } from './core/application/slots.service';
import { BookingsService } from './core/application/bookings.service';
import { Clock } from './core/application/clock';
import { AdminEventsController } from './controllers/admin/events.controller';
import { AdminScheduleController } from './controllers/admin/schedule.controller';
import { AdminBookingsController } from './controllers/admin/bookings.controller';
import { PublicEventsController } from './controllers/public/events.controller';
import { PublicBookingsController } from './controllers/public/bookings.controller';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: process.env.STATIC_ROOT ?? join(process.cwd(), 'public'),
      exclude: ['/api/(.*)'],
      serveStaticOptions: { fallthrough: true },
    }),
  ],
  controllers: [
    AdminEventsController,
    AdminScheduleController,
    AdminBookingsController,
    PublicEventsController,
    PublicBookingsController,
  ],
  providers: [
    EventsRepository,
    BookingsRepository,
    ScheduleRepository,
    EventsService,
    ScheduleService,
    SlotsService,
    BookingsService,
    Clock,
  ],
})
export class AppModule {}
