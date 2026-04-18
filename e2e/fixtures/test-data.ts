/**
 * Тестовые данные и fixtures для E2E тестов
 */

import type { Booking, CreateEventRequest, DaySchedule, Event, Guest, WeeklySchedule } from './types';

// ─── Event Fixtures ───

export const sampleEvents: Event[] = [
  {
    id: 'event-1',
    title: 'Intro Call',
    description: 'A 30-minute introductory meeting to discuss your needs',
    duration: 30,
    slug: 'intro-call',
    active: true,
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'event-2',
    title: 'Discovery Call',
    description: '60-minute deep dive into your project requirements',
    duration: 60,
    slug: 'discovery-call',
    active: true,
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'event-3',
    title: 'Quick Chat',
    description: '15-minute quick discussion',
    duration: 15,
    slug: 'quick-chat',
    active: true,
    createdAt: '2026-04-03T10:00:00Z',
    updatedAt: '2026-04-03T10:00:00Z',
  },
  {
    id: 'event-4',
    title: 'Inactive Event',
    description: 'This event is inactive and should not appear publicly',
    duration: 30,
    slug: 'inactive-event',
    active: false,
    createdAt: '2026-04-04T10:00:00Z',
    updatedAt: '2026-04-04T10:00:00Z',
  },
];

export const newEventData: CreateEventRequest = {
  title: 'Consultation',
  description: 'One-hour consultation session',
  duration: 60,
  slug: 'consultation',
};

export const invalidEventData = {
  emptyTitle: {
    title: '',
    description: 'Test description',
    duration: 30,
    slug: 'test-event',
  },
  invalidSlug: {
    title: 'Test Event',
    description: 'Test description',
    duration: 30,
    slug: '123-invalid',
  },
  tooLongTitle: {
    title: 'a'.repeat(101),
    description: 'Test description',
    duration: 30,
    slug: 'test-event',
  },
  tooShortDuration: {
    title: 'Test Event',
    description: 'Test description',
    duration: 4,
    slug: 'test-event',
  },
  tooLongDuration: {
    title: 'Test Event',
    description: 'Test description',
    duration: 481,
    slug: 'test-event',
  },
};

// ─── Schedule Fixtures ───

export const defaultWeekdaySchedule: DaySchedule = {
  enabled: true,
  blocks: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '17:00' },
  ],
};

export const fullDaySchedule: DaySchedule = {
  enabled: true,
  blocks: [
    { start: '09:00', end: '17:00' },
  ],
};

export const disabledDaySchedule: DaySchedule = {
  enabled: false,
  blocks: [],
};

export const defaultWeeklySchedule: WeeklySchedule = {
  weekdays: {
    monday: defaultWeekdaySchedule,
    tuesday: defaultWeekdaySchedule,
    wednesday: defaultWeekdaySchedule,
    thursday: defaultWeekdaySchedule,
    friday: defaultWeekdaySchedule,
    saturday: disabledDaySchedule,
    sunday: disabledDaySchedule,
  },
};

export const fullWeeklySchedule: WeeklySchedule = {
  weekdays: {
    monday: fullDaySchedule,
    tuesday: fullDaySchedule,
    wednesday: fullDaySchedule,
    thursday: fullDaySchedule,
    friday: fullDaySchedule,
    saturday: disabledDaySchedule,
    sunday: disabledDaySchedule,
  },
};

// ─── Guest Fixtures ───

export const sampleGuests: Guest[] = [
  {
    name: 'Иван Петров',
    email: 'ivan@example.com',
    notes: 'Жду встречи с нетерпением',
  },
  {
    name: 'Jane Doe',
    email: 'jane@example.com',
  },
  {
    name: 'John Smith',
    email: 'john.smith@company.com',
    notes: 'Discussing project details',
  },
];

export const invalidGuestData = {
  emptyName: {
    name: '',
    email: 'test@example.com',
  },
  invalidEmail: {
    name: 'Test User',
    email: 'invalid-email',
  },
  tooLongName: {
    name: 'a'.repeat(101),
    email: 'test@example.com',
  },
  tooLongNotes: {
    name: 'Test User',
    email: 'test@example.com',
    notes: 'a'.repeat(501),
  },
};

// ─── Booking Fixtures ───

export const sampleBooking: Booking = {
  id: 'booking-1',
  eventId: 'event-1',
  startTime: '2026-04-15T09:00:00Z',
  status: 'active',
  guest: sampleGuests[0]!,
  createdAt: '2026-04-11T12:00:00Z',
};

// ─── Auth Fixtures ───

export const adminCredentials = {
  username: 'admin',
  password: 'admin123',
};

// ─── Helper Functions ───

/**
 * Генерирует уникальный slug для тестов
 */
export function generateUniqueSlug(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Генерирует уникальный email для тестов
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@example.com`;
}

/**
 * Получает дату в формате YYYY-MM-DD для тестов
 * @param daysFromNow количество дней от сегодня (0 = сегодня)
 */
export function getTestDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]!;
}

/**
 * Получает дату следующего понедельника
 */
export function getNextMonday(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) + 7;
  date.setDate(diff);
  return date.toISOString().split('T')[0]!;
}

/**
 * Проверяет, является ли дата рабочим днём (пн-пт)
 */
export function isWeekday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day >= 1 && day <= 5;
}
