import { Guest } from './guest';

export type BookingStatus = 'active' | 'cancelled';

export interface Booking {
  id: string;
  eventId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  guest: Guest;
  createdAt: string;
  cancelToken: string;
}
