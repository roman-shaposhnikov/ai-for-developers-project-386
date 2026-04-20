import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PublicBookingsService {
  constructor(private readonly storage: StorageService) {}

  cancel(id: string, cancelToken: string): void {
    const booking = this.storage.findBookingById(id);
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Booking not found',
      });
    }

    if (booking.cancelToken !== cancelToken) {
      throw new ForbiddenException({
        code: 'INVALID_CANCEL_TOKEN',
        message: 'Invalid cancel token',
      });
    }

    if (booking.status === 'cancelled') {
      throw new ConflictException({
        code: 'ALREADY_CANCELLED',
        message: 'Booking is already cancelled',
      });
    }

    this.storage.updateBooking(id, { status: 'cancelled' });
  }
}
