import { apiClient } from './client';
import type { Event, CreateEventRequest, UpdateEventRequest, BookingWithEvent } from './types';

export const eventsApi = {
  list: (): Promise<Event[]> => {
    return apiClient.get<Event[]>('/events', true);
  },

  get: (slug: string): Promise<Event> => {
    return apiClient.get<Event>(`/events/${slug}`, true);
  },

  create: (data: CreateEventRequest): Promise<Event> => {
    return apiClient.post<Event>('/events', data, true);
  },

  update: (slug: string, data: UpdateEventRequest): Promise<Event> => {
    return apiClient.patch<Event>(`/events/${slug}`, data, true);
  },

  delete: (slug: string): Promise<void> => {
    return apiClient.delete(`/events/${slug}`, true);
  },

  getBookings: (): Promise<BookingWithEvent[]> => {
    return apiClient.get<BookingWithEvent[]>('/bookings', true);
  },

  getBooking: (id: string): Promise<BookingWithEvent> => {
    return apiClient.get<BookingWithEvent>(`/bookings/${id}`, true);
  },

  cancelBooking: (id: string): Promise<void> => {
    return apiClient.delete(`/bookings/${id}`, true);
  },
};
