import { apiClient } from './client';
import type { Event, SlotsResponse, CreateBookingRequest, BookingCreatedResponse } from './types';

export const publicApi = {
  listEvents: (): Promise<Event[]> => {
    return apiClient.get<Event[]>('/public/events', false);
  },

  getEvent: (slug: string): Promise<Event> => {
    return apiClient.get<Event>(`/public/events/${slug}`, false);
  },

  getSlots: (slug: string, date: string): Promise<SlotsResponse> => {
    return apiClient.get<SlotsResponse>(`/public/events/${slug}/slots?date=${date}`, false);
  },

  createBooking: (slug: string, data: CreateBookingRequest): Promise<BookingCreatedResponse> => {
    return apiClient.post<BookingCreatedResponse>(`/public/events/${slug}/bookings`, data, false);
  },

  cancelBooking: (id: string, cancelToken: string): Promise<void> => {
    return apiClient.delete(`/public/bookings/${id}?cancelToken=${encodeURIComponent(cancelToken)}`, false);
  },
};
