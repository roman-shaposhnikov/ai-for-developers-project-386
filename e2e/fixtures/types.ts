/**
 * TypeScript типы для API и тестов
 */

// ─── Event Types ───

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

export interface CreateEventRequest {
  title: string;
  description: string;
  duration: number;
  slug: string;
  active?: boolean;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  duration?: number;
  active?: boolean;
}

export interface EventSummary {
  title: string;
  slug: string;
  duration: number;
}

// ─── Schedule Types ───

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

// ─── Booking Types ───

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
  guest: Guest;
  createdAt: string;
}

export interface BookingWithEvent extends Booking {
  event: EventSummary;
}

export interface BookingCreatedResponse {
  id: string;
  eventId: string;
  startTime: string;
  status: BookingStatus;
  cancelToken: string;
  guest: Guest;
  createdAt: string;
}

export interface CreateBookingRequest {
  startTime: string;
  guest: Guest;
}

// ─── Slot Types ───

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

// ─── Error Types ───

export interface ErrorBody {
  code: string;
  message: string;
}

export interface ErrorResponse {
  error: ErrorBody;
}

// ─── API Response Types ───

export type ApiResponse<T> =
  | { success: true; data: T; status: number }
  | { success: false; error: ErrorBody; status: number };
