/**
 * API Mocks для тестов без backend сервера
 * Использует Playwright route interception
 */

import { Page, APIRequestContext } from '@playwright/test';
import { 
  Event, 
  Booking, 
  BookingCreatedResponse,
  WeeklySchedule,
  SlotsResponse,
  Guest,
  CreateEventRequest,
  UpdateEventRequest,
  CreateBookingRequest,
  ErrorResponse,
} from '../fixtures/types';

const API_BASE = 'http://localhost:3000/api/v1';

/**
 * Класс для управления моками API
 */
export class ApiMock {
  private page: Page;
  private storage: {
    events: Map<string, Event>;
    bookings: Map<string, BookingCreatedResponse>;
    schedule: WeeklySchedule | null;
  };

  constructor(page: Page) {
    this.page = page;
    this.storage = {
      events: new Map(),
      bookings: new Map(),
      schedule: null,
    };
  }

  /**
   * Активирует все моки API
   */
  async setup() {
    await this.setupAdminEventsMocks();
    await this.setupAdminScheduleMocks();
    await this.setupAdminBookingsMocks();
    await this.setupPublicEventsMocks();
    await this.setupPublicBookingsMocks();
  }

  /**
   * Очищает все данные моков
   */
  clear() {
    this.storage.events.clear();
    this.storage.bookings.clear();
    this.storage.schedule = null;
  }

  // ─── Admin: Events Mocks ───

  private async setupAdminEventsMocks() {
    // POST /api/v1/events - Create event
    await this.page.route(`${API_BASE}/events`, async (route) => {
      const method = route.request().method();
      
      if (method === 'POST') {
        const body = await route.request().postDataJSON() as CreateEventRequest;
        
        // Check for duplicate slug
        if (this.storage.events.has(body.slug)) {
          const error: ErrorResponse = {
            error: { code: 'SLUG_TAKEN', message: 'Event with this slug already exists' }
          };
          return route.fulfill({ status: 409, body: JSON.stringify(error) });
        }

        // Validate slug format
        if (!/^[a-z][a-z0-9-]*$/.test(body.slug)) {
          const error: ErrorResponse = {
            error: { code: 'VALIDATION_ERROR', message: 'Invalid slug format' }
          };
          return route.fulfill({ status: 400, body: JSON.stringify(error) });
        }

        const event: Event = {
          id: `event-${Date.now()}`,
          ...body,
          active: body.active ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        this.storage.events.set(body.slug, event);
        return route.fulfill({ status: 201, body: JSON.stringify(event) });
      }
      
      if (method === 'GET') {
        const events = Array.from(this.storage.events.values());
        return route.fulfill({ status: 200, body: JSON.stringify(events) });
      }
      
      return route.continue();
    });

    // GET / PATCH / DELETE /api/v1/events/{slug}
    await this.page.route(`${API_BASE}/events/*`, async (route) => {
      const url = new URL(route.request().url());
      const slug = url.pathname.split('/').pop() || '';
      const method = route.request().method();

      if (method === 'GET') {
        const event = this.storage.events.get(slug);
        if (!event) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Event not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }
        return route.fulfill({ status: 200, body: JSON.stringify(event) });
      }

      if (method === 'PATCH') {
        const existing = this.storage.events.get(slug);
        if (!existing) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Event not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }

        const body = await route.request().postDataJSON() as UpdateEventRequest;
        const updated: Event = {
          ...existing,
          ...body,
          updatedAt: new Date().toISOString(),
        };
        
        this.storage.events.set(slug, updated);
        return route.fulfill({ status: 200, body: JSON.stringify(updated) });
      }

      if (method === 'DELETE') {
        const existing = this.storage.events.get(slug);
        if (!existing) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Event not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }

        // Check for active bookings
        const hasActiveBookings = Array.from(this.storage.bookings.values())
          .some(b => b.eventId === existing.id && b.status === 'active');
        
        if (hasActiveBookings) {
          const error: ErrorResponse = {
            error: { code: 'HAS_ACTIVE_BOOKINGS', message: 'Cannot delete event with active bookings' }
          };
          return route.fulfill({ status: 409, body: JSON.stringify(error) });
        }

        this.storage.events.delete(slug);
        return route.fulfill({ status: 204 });
      }

      return route.continue();
    });
  }

  // ─── Admin: Schedule Mocks ───

  private async setupAdminScheduleMocks() {
    await this.page.route(`${API_BASE}/schedule`, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        const schedule = this.storage.schedule || this.getDefaultSchedule();
        return route.fulfill({ status: 200, body: JSON.stringify(schedule) });
      }

      if (method === 'PUT') {
        const body = await route.request().postDataJSON() as WeeklySchedule;
        
        // Validate no overlapping blocks
        for (const [day, daySchedule] of Object.entries(body.weekdays)) {
          if (daySchedule.enabled && daySchedule.blocks.length > 1) {
            for (let i = 0; i < daySchedule.blocks.length - 1; i++) {
              const current = daySchedule.blocks[i];
              const next = daySchedule.blocks[i + 1];
              if (current.end > next.start) {
                const error: ErrorResponse = {
                  error: { code: 'INVALID_SCHEDULE', message: 'Overlapping time blocks' }
                };
                return route.fulfill({ status: 400, body: JSON.stringify(error) });
              }
            }
          }
        }

        this.storage.schedule = body;
        return route.fulfill({ status: 200, body: JSON.stringify(body) });
      }

      return route.continue();
    });
  }

  // ─── Admin: Bookings Mocks ───

  private async setupAdminBookingsMocks() {
    // GET /api/v1/bookings
    await this.page.route(`${API_BASE}/bookings`, async (route) => {
      const method = route.request().method();
      
      if (method === 'GET') {
        const now = new Date().toISOString();
        const bookings = Array.from(this.storage.bookings.values())
          .filter(b => b.status === 'active' && b.startTime >= now)
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map(b => {
            const event = Array.from(this.storage.events.values())
              .find(e => e.id === b.eventId);
            return {
              ...b,
              event: event ? {
                title: event.title,
                slug: event.slug,
                duration: event.duration,
              } : null,
            };
          });
        
        return route.fulfill({ status: 200, body: JSON.stringify(bookings) });
      }

      return route.continue();
    });

    // GET / DELETE /api/v1/bookings/{id}
    await this.page.route(`${API_BASE}/bookings/*`, async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').pop() || '';
      const method = route.request().method();

      if (method === 'GET') {
        const booking = this.storage.bookings.get(id);
        if (!booking) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Booking not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }

        const event = Array.from(this.storage.events.values())
          .find(e => e.id === booking.eventId);
        
        return route.fulfill({ 
          status: 200, 
          body: JSON.stringify({
            ...booking,
            event: event ? {
              title: event.title,
              slug: event.slug,
              duration: event.duration,
            } : null,
          })
        });
      }

      if (method === 'DELETE') {
        const booking = this.storage.bookings.get(id);
        if (!booking) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Booking not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }

        if (booking.status === 'cancelled') {
          const error: ErrorResponse = {
            error: { code: 'ALREADY_CANCELLED', message: 'Booking already cancelled' }
          };
          return route.fulfill({ status: 409, body: JSON.stringify(error) });
        }

        booking.status = 'cancelled';
        return route.fulfill({ status: 204 });
      }

      return route.continue();
    });
  }

  // ─── Public: Events Mocks ───

  private async setupPublicEventsMocks() {
    // GET /api/v1/public/events
    await this.page.route(`${API_BASE}/public/events`, async (route) => {
      const events = Array.from(this.storage.events.values())
        .filter(e => e.active);
      return route.fulfill({ status: 200, body: JSON.stringify(events) });
    });

    // GET /api/v1/public/events/{slug}
    await this.page.route(`${API_BASE}/public/events/*`, async (route) => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.split('/');
      const slug = pathParts[pathParts.length - 1];
      
      // Check if this is a slots request
      if (slug === 'slots') {
        const eventSlug = pathParts[pathParts.length - 2];
        const date = url.searchParams.get('date');
        
        if (!date) {
          const error: ErrorResponse = {
            error: { code: 'VALIDATION_ERROR', message: 'Date parameter is required' }
          };
          return route.fulfill({ status: 400, body: JSON.stringify(error) });
        }

        // Check date range (14 days window)
        const requestedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 14);

        if (requestedDate < today || requestedDate > maxDate) {
          const error: ErrorResponse = {
            error: { code: 'DATE_OUT_OF_RANGE', message: 'Date outside 14-day booking window' }
          };
          return route.fulfill({ status: 400, body: JSON.stringify(error) });
        }

        const event = this.storage.events.get(eventSlug);
        if (!event || !event.active) {
          const error: ErrorResponse = {
            error: { code: 'NOT_FOUND', message: 'Event not found' }
          };
          return route.fulfill({ status: 404, body: JSON.stringify(error) });
        }

        // Generate slots based on schedule
        const schedule = this.storage.schedule || this.getDefaultSchedule();
        const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase();
        const daySchedule = schedule.weekdays[dayOfWeek as keyof typeof schedule.weekdays];

        let slots: { startTime: string; endTime: string }[] = [];

        if (daySchedule?.enabled) {
          for (const block of daySchedule.blocks) {
            let currentTime = new Date(`${date}T${block.start}:00Z`);
            const blockEnd = new Date(`${date}T${block.end}:00Z`);

            while (currentTime < blockEnd) {
              const slotEnd = new Date(currentTime.getTime() + event.duration * 60000);
              if (slotEnd <= blockEnd) {
                slots.push({
                  startTime: currentTime.toISOString(),
                  endTime: slotEnd.toISOString(),
                });
              }
              currentTime = slotEnd;
            }
          }
        }

        // Filter out booked slots
        const now = new Date().toISOString();
        slots = slots.filter(slot => {
          const isPast = slot.startTime < now;
          const isBooked = Array.from(this.storage.bookings.values())
            .some(b => 
              b.status === 'active' && 
              b.startTime < slot.endTime && 
              new Date(b.startTime).getTime() + event.duration * 60000 > new Date(slot.startTime).getTime()
            );
          return !isPast && !isBooked;
        });

        const response: SlotsResponse = {
          date,
          eventSlug,
          duration: event.duration,
          slots,
        };

        return route.fulfill({ status: 200, body: JSON.stringify(response) });
      }

      // Regular event read
      const event = this.storage.events.get(slug);
      if (!event || !event.active) {
        const error: ErrorResponse = {
          error: { code: 'NOT_FOUND', message: 'Event not found' }
        };
        return route.fulfill({ status: 404, body: JSON.stringify(error) });
      }

      return route.fulfill({ status: 200, body: JSON.stringify(event) });
    });
  }

  // ─── Public: Bookings Mocks ───

  private async setupPublicBookingsMocks() {
    // POST /api/v1/public/events/{slug}/bookings
    await this.page.route(`${API_BASE}/public/events/*/bookings`, async (route) => {
      const url = new URL(route.request().url());
      const slug = url.pathname.split('/').slice(-2)[0];
      
      const event = this.storage.events.get(slug);
      if (!event || !event.active) {
        const error: ErrorResponse = {
          error: { code: 'NOT_FOUND', message: 'Event not found' }
        };
        return route.fulfill({ status: 404, body: JSON.stringify(error) });
      }

      const body = await route.request().postDataJSON() as CreateBookingRequest;
      
      // Check if slot is available
      const isBooked = Array.from(this.storage.bookings.values())
        .some(b => 
          b.status === 'active' && 
          b.eventId === event.id &&
          b.startTime === body.startTime
        );

      if (isBooked) {
        const error: ErrorResponse = {
          error: { code: 'SLOT_UNAVAILABLE', message: 'Time slot is no longer available' }
        };
        return route.fulfill({ status: 409, body: JSON.stringify(error) });
      }

      // Validate slot alignment
      const requestedDate = new Date(body.startTime);
      const minutes = requestedDate.getUTCMinutes();
      if (minutes % 5 !== 0 || minutes % event.duration !== 0) {
        const error: ErrorResponse = {
          error: { code: 'INVALID_SLOT_TIME', message: 'Start time does not align with slot boundary' }
        };
        return route.fulfill({ status: 400, body: JSON.stringify(error) });
      }

      const booking: BookingCreatedResponse = {
        id: `booking-${Date.now()}`,
        eventId: event.id,
        startTime: body.startTime,
        status: 'active',
        cancelToken: `token-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        guest: body.guest,
        createdAt: new Date().toISOString(),
      };

      this.storage.bookings.set(booking.id, booking);
      return route.fulfill({ status: 201, body: JSON.stringify(booking) });
    });

    // DELETE /api/v1/public/bookings/{id}?cancelToken={token}
    await this.page.route(`${API_BASE}/public/bookings/*`, async (route) => {
      const url = new URL(route.request().url());
      const id = url.pathname.split('/').pop() || '';
      const cancelToken = url.searchParams.get('cancelToken');
      
      const booking = this.storage.bookings.get(id);
      if (!booking) {
        const error: ErrorResponse = {
          error: { code: 'NOT_FOUND', message: 'Booking not found' }
        };
        return route.fulfill({ status: 404, body: JSON.stringify(error) });
      }

      if (booking.cancelToken !== cancelToken) {
        const error: ErrorResponse = {
          error: { code: 'INVALID_CANCEL_TOKEN', message: 'Invalid cancel token' }
        };
        return route.fulfill({ status: 403, body: JSON.stringify(error) });
      }

      booking.status = 'cancelled';
      return route.fulfill({ status: 204 });
    });
  }

  // ─── Helper Methods ───

  private getDefaultSchedule(): WeeklySchedule {
    const defaultDay = {
      enabled: true,
      blocks: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '17:00' },
      ],
    };

    return {
      weekdays: {
        monday: defaultDay,
        tuesday: defaultDay,
        wednesday: defaultDay,
        thursday: defaultDay,
        friday: defaultDay,
        saturday: { enabled: false, blocks: [] },
        sunday: { enabled: false, blocks: [] },
      },
    };
  }

  /**
   * Добавляет тестовое событие напрямую в мок
   */
  addEvent(event: Event) {
    this.storage.events.set(event.slug, event);
  }

  /**
   * Добавляет тестовое бронирование напрямую в мок
   */
  addBooking(booking: BookingCreatedResponse) {
    this.storage.bookings.set(booking.id, booking);
  }

  /**
   * Устанавливает расписание напрямую в мок
   */
  setSchedule(schedule: WeeklySchedule) {
    this.storage.schedule = schedule;
  }

  /**
   * Получает все события из мока
   */
  getEvents(): Event[] {
    return Array.from(this.storage.events.values());
  }

  /**
   * Получает все бронирования из мока
   */
  getBookings(): BookingCreatedResponse[] {
    return Array.from(this.storage.bookings.values());
  }
}

/**
 * Создает экземпляр ApiMock
 */
export function createApiMock(page: Page): ApiMock {
  return new ApiMock(page);
}
