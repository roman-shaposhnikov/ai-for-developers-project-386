// API Types based on OpenAPI spec

export interface Event {
  id: string;
  title: string;
  description: string;
  duration: number;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  title: string;
  slug: string;
  duration: number;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  duration: number;
  slug: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  duration?: number;
  active?: boolean;
}

export interface Booking {
  id: string;
  eventId: string;
  startTime: string;
  status: BookingStatus;
  guest: Guest;
  createdAt: string;
}

export interface BookingWithEvent extends Booking {
  event: EventSummary;
}

export interface BookingCreatedResponse extends Booking {
  cancelToken: string;
}

export type BookingStatus = 'active' | 'cancelled';

export interface Guest {
  name: string;
  email: string;
  notes?: string;
}

export interface CreateBookingRequest {
  startTime: string;
  guest: Guest;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  date: string;
  eventSlug: string;
  duration: number;
  slots: Slot[];
}

export interface TimeBlock {
  start: string;
  end: string;
}

export interface DaySchedule {
  enabled: boolean;
  blocks: TimeBlock[];
}

export interface Weekdays {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface WeeklySchedule {
  weekdays: Weekdays;
}

export interface ErrorBody {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: ErrorBody;
}

// Form data types
export interface EventFormData {
  title: string;
  slug: string;
  duration: number;
  description: string;
  active: boolean;
}
