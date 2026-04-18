import { Controller, Delete, Param, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PublicBookingsService } from './public-bookings.service';

@Controller('public/bookings')
export class PublicBookingsController {
  constructor(private readonly publicBookingsService: PublicBookingsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(
    @Param('id') id: string,
    @Query('cancelToken') cancelToken: string,
  ): void {
    if (!cancelToken) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'cancelToken query parameter is required',
      });
    }
    this.publicBookingsService.cancel(id, cancelToken);
  }
}
