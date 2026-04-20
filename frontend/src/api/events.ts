import { apiClient } from './client';
import type { Event, CreateEventRequest, UpdateEventRequest, BookingWithEvent } from './types';

export const eventsApi = {
  list: (): Promise<Event[]> => {
    return apiClient.get<Event[]>('/events');
  },

  get: (slug: string): Promise<Event> => {
    return apiClient.get<Event>(`/events/${slug}`);
  },

  create: (data: CreateEventRequest): Promise<Event> => {
    return apiClient.post<Event>('/events', data);
  },

  update: (slug: string, data: UpdateEventRequest): Promise<Event> => {
    return apiClient.patch<Event>(`/events/${slug}`, data);
  },

  delete: (slug: string): Promise<void> => {
    return apiClient.delete(`/events/${slug}`);
  },

  getBookings: (): Promise<BookingWithEvent[]> => {
    return apiClient.get<BookingWithEvent[]>('/bookings');
  },

  getBooking: (id: string): Promise<BookingWithEvent> => {
    return apiClient.get<BookingWithEvent>(`/bookings/${id}`);
  },

  cancelBooking: (id: string): Promise<void> => {
    return apiClient.delete(`/bookings/${id}`);
  },
};
