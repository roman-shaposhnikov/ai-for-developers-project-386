import { Module } from '@nestjs/common';
import { PublicBookingsController } from './public-bookings.controller';
import { PublicBookingsService } from './public-bookings.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [PublicBookingsController],
  providers: [PublicBookingsService],
})
export class PublicBookingsModule {}
