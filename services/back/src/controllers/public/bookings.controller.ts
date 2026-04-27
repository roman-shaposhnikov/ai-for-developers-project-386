import {
  Controller,
  Delete,
  HttpCode,
  Param,
  Query,
} from '@nestjs/common';
import { BookingsService } from '../../core/application/bookings.service';
import { DomainError } from '../../core/domain/errors';

@Controller('public/bookings')
export class PublicBookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Delete(':id')
  @HttpCode(204)
  cancel(@Param('id') id: string, @Query('cancelToken') token?: string): void {
    if (!token) {
      throw DomainError.forbidden(
        'INVALID_CANCEL_TOKEN',
        'cancelToken is required',
      );
    }
    this.bookings.cancelByGuest(id, token);
  }
}
