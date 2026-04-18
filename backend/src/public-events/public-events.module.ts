import { Module } from '@nestjs/common';
import { PublicEventsController } from './public-events.controller';
import { PublicEventsService } from './public-events.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [PublicEventsController],
  providers: [PublicEventsService],
  exports: [PublicEventsService],
})
export class PublicEventsModule {}
