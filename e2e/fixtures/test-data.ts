import { randomUUID } from 'crypto';
import type { Event, Booking, GuestInfo } from '../../../frontend/src/api/types';

/**
 * Test data generators for E2E tests
 * Used to create consistent test data via API calls
 */

// Backend URL for API calls
export const BACKEND_URL = 'http://localhost:3000';
export const FRONTEND_URL = 'http://localhost:8080';

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

/**
 * Create a test event via API
 */
export async function createEvent(eventData: Partial<Event> & { title: string; duration: number }): Promise<Event> {
  const slug = eventData.slug || generateSlug(eventData.title);
  
  const response = await fetch(`${BACKEND_URL}/api/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: eventData.title,
      slug,
      duration: eventData.duration,
      description: eventData.description || '',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Update an event via API (for changing active status)
 */
export async function updateEvent(slug: string, updates: Partial<Event>): Promise<Event> {
  const response = await fetch(`${BACKEND_URL}/api/v1/events/${slug}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Delete an event via API
 */
export async function deleteEvent(slug: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/events/${slug}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete event: ${response.status}`);
  }
}

/**
 * Get all events via API
 */
export async function getEvents(): Promise<Event[]> {
  const response = await fetch(`${BACKEND_URL}/api/v1/events`);
  
  if (!response.ok) {
    throw new Error(`Failed to get events: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all bookings via API
 */
export async function getBookings(): Promise<Booking[]> {
  const response = await fetch(`${BACKEND_URL}/api/v1/bookings`);
  
  if (!response.ok) {
    throw new Error(`Failed to get bookings: ${response.status}`);
  }

  return response.json();
}

/**
 * Create a booking via API
 */
export async function createBooking(
  eventSlug: string,
  startTime: string,
  guest: GuestInfo
): Promise<Booking> {
  const response = await fetch(`${BACKEND_URL}/api/v1/public/events/${eventSlug}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startTime,
      guest,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Cancel a booking via API (admin)
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/bookings/${bookingId}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to cancel booking: ${response.status}`);
  }
}

/**
 * Clear all test data
 */
export async function clearAllData(): Promise<void> {
  // Delete all bookings first (to avoid FK-like constraints)
  const bookings = await getBookings();
  for (const booking of bookings) {
    await cancelBooking(booking.id);
  }

  // Delete all events
  const events = await getEvents();
  for (const event of events) {
    await deleteEvent(event.slug);
  }
}

/**
 * Standard test events
 */
export const testEvents = {
  active: {
    title: 'Test Consultation',
    duration: 30,
    description: 'Test description',
  },
  activeLong: {
    title: 'Test Architecture Session',
    duration: 60,
    description: 'Long session for testing',
  },
  inactive: {
    title: 'Test Inactive Event',
    duration: 15,
    description: 'Should not be visible to guests',
  },
};

/**
 * Standard test guest
 */
export const testGuest: GuestInfo = {
  name: 'Test User',
  email: 'test@example.com',
  notes: 'Test booking notes',
};

/**
 * Generate a future date string (YYYY-MM-DD)
 */
export function getFutureDate(daysFromNow: number = 1): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a time slot string for testing
 */
export function getTimeSlot(date: string, hour: number, minute: number = 0): string {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
}
