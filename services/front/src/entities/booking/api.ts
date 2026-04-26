import { api, unwrap, unwrapVoid } from '@/shared/api';
import type {
  BookingCreatedResponse,
  BookingWithEvent,
  CreateBookingRequest,
} from './model';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: () => ['bookings', 'list'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
};

export async function listAdminBookings(): Promise<BookingWithEvent[]> {
  return unwrap(await api.GET('/api/v1/bookings'));
}

export async function getAdminBooking(id: string): Promise<BookingWithEvent> {
  return unwrap(await api.GET('/api/v1/bookings/{id}', { params: { path: { id } } }));
}

export async function cancelAdminBooking(id: string): Promise<void> {
  unwrapVoid(await api.DELETE('/api/v1/bookings/{id}', { params: { path: { id } } }));
}

export async function createPublicBooking(
  slug: string,
  body: CreateBookingRequest,
): Promise<BookingCreatedResponse> {
  return unwrap(
    await api.POST('/api/v1/public/events/{slug}/bookings', {
      params: { path: { slug } },
      body,
    }),
  );
}

export async function cancelPublicBooking(id: string, cancelToken: string): Promise<void> {
  unwrapVoid(
    await api.DELETE('/api/v1/public/bookings/{id}', {
      params: { path: { id }, query: { cancelToken } },
    }),
  );
}
