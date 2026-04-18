export type BookingStatus = 'active' | 'cancelled';

export interface Guest {
  name: string;
  email: string;
  notes?: string;
}

export interface Booking {
  id: string;
  eventId: string;
  startTime: string;
  status: BookingStatus;
  cancelToken: string;
  guest: Guest;
  createdAt: string;
}

export interface BookingWithEvent extends Booking {
  event: {
    title: string;
    slug: string;
    duration: number;
  };
}
