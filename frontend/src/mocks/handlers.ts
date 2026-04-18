import { http, HttpResponse } from 'msw';
import type {
  Event,
  Booking,
  BookingWithEvent,
  BookingCreatedResponse,
  SlotsResponse,
  CreateEventRequest,
  UpdateEventRequest,
  CreateBookingRequest,
} from '../api/types';

// Mock data storage
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Консультация по разработке',
    description: 'Обсуждение проекта и технических решений',
    duration: 60,
    slug: 'dev-consultation',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Code Review',
    description: 'Ревью кода и рекомендации по улучшению',
    duration: 30,
    slug: 'code-review',
    active: true,
    createdAt: '2024-01-16T14:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
  },
  {
    id: '3',
    title: 'Архитектурная сессия',
    description: 'Проектирование архитектуры системы',
    duration: 90,
    slug: 'architecture-session',
    active: false,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T16:00:00Z',
  },
];

const mockBookings: BookingWithEvent[] = [
  {
    id: 'b1',
    eventId: '1',
    startTime: '2024-04-20T10:00:00Z',
    status: 'active',
    guest: {
      name: 'Иван Петров',
      email: 'ivan@example.com',
      notes: 'Нужна помощь с React',
    },
    createdAt: '2024-04-18T08:00:00Z',
    event: {
      title: 'Консультация по разработке',
      slug: 'dev-consultation',
      duration: 60,
    },
  },
  {
    id: 'b2',
    eventId: '2',
    startTime: '2024-04-21T14:30:00Z',
    status: 'active',
    guest: {
      name: 'Анна Сидорова',
      email: 'anna@example.com',
    },
    createdAt: '2024-04-18T09:00:00Z',
    event: {
      title: 'Code Review',
      slug: 'code-review',
      duration: 30,
    },
  },
];

// Helper to generate slots for a date
function generateSlots(date: string, duration: number): SlotsResponse {
  const slots = [];
  const startHour = 9; // 9:00
  const endHour = 18; // 18:00
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      const endDate = new Date(`2000-01-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      endDate.setMinutes(endDate.getMinutes() + duration);
      const endTime = `${date}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00Z`;
      
      slots.push({ startTime, endTime });
    }
  }
  
  return {
    date,
    eventSlug: 'test',
    duration,
    slots,
  };
}

export const handlers = [
  // ========== Public API ==========
  
  // GET /api/v1/public/events
  http.get('/api/v1/public/events', () => {
    const activeEvents = mockEvents.filter(e => e.active);
    return HttpResponse.json(activeEvents);
  }),

  // GET /api/v1/public/events/:slug
  http.get('/api/v1/public/events/:slug', ({ params }) => {
    const event = mockEvents.find(e => e.slug === params.slug && e.active);
    if (!event) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json(event);
  }),

  // GET /api/v1/public/events/:slug/slots
  http.get('/api/v1/public/events/:slug/slots', ({ params, request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    const event = mockEvents.find(e => e.slug === params.slug && e.active);
    if (!event) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    
    if (!date) {
      return HttpResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Date parameter required' } },
        { status: 400 }
      );
    }
    
    return HttpResponse.json(generateSlots(date, event.duration));
  }),

  // POST /api/v1/public/events/:slug/bookings
  http.post('/api/v1/public/events/:slug/bookings', async ({ params, request }) => {
    const event = mockEvents.find(e => e.slug === params.slug && e.active);
    if (!event) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    
    const data = await request.json() as CreateBookingRequest;
    
    const booking: BookingCreatedResponse = {
      id: `b${Date.now()}`,
      eventId: event.id,
      startTime: data.startTime,
      status: 'active',
      guest: data.guest,
      createdAt: new Date().toISOString(),
      cancelToken: `token-${Date.now()}`,
    };
    
    mockBookings.push({
      ...booking,
      event: {
        title: event.title,
        slug: event.slug,
        duration: event.duration,
      },
    });
    
    return HttpResponse.json(booking, { status: 201 });
  }),

  // DELETE /api/v1/public/bookings/:id
  http.delete('/api/v1/public/bookings/:id', ({ params, request }) => {
    const url = new URL(request.url);
    const cancelToken = url.searchParams.get('cancelToken');
    
    const bookingIndex = mockBookings.findIndex(b => b.id === params.id);
    if (bookingIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }
    
    // In a real app, we'd validate cancelToken
    if (!cancelToken) {
      return HttpResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Cancel token required' } },
        { status: 400 }
      );
    }
    
    mockBookings[bookingIndex].status = 'cancelled';
    return new HttpResponse(null, { status: 204 });
  }),

  // ========== Admin API ==========
  
  // GET /api/v1/events
  http.get('/api/v1/events', () => {
    return HttpResponse.json(mockEvents);
  }),

  // GET /api/v1/events/:slug
  http.get('/api/v1/events/:slug', ({ params }) => {
    const event = mockEvents.find(e => e.slug === params.slug);
    if (!event) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json(event);
  }),

  // POST /api/v1/events
  http.post('/api/v1/events', async ({ request }) => {
    const data = await request.json() as CreateEventRequest;
    
    // Check for duplicate slug
    if (mockEvents.some(e => e.slug === data.slug)) {
      return HttpResponse.json(
        { error: { code: 'DUPLICATE_SLUG', message: 'Event with this slug already exists' } },
        { status: 409 }
      );
    }
    
    const event: Event = {
      id: `${mockEvents.length + 1}`,
      ...data,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockEvents.push(event);
    return HttpResponse.json(event, { status: 201 });
  }),

  // PATCH /api/v1/events/:slug
  http.patch('/api/v1/events/:slug', async ({ params, request }) => {
    const eventIndex = mockEvents.findIndex(e => e.slug === params.slug);
    if (eventIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    
    const data = await request.json() as UpdateEventRequest;
    
    mockEvents[eventIndex] = {
      ...mockEvents[eventIndex],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockEvents[eventIndex]);
  }),

  // DELETE /api/v1/events/:slug
  http.delete('/api/v1/events/:slug', ({ params }) => {
    const eventIndex = mockEvents.findIndex(e => e.slug === params.slug);
    if (eventIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } },
        { status: 404 }
      );
    }
    
    mockEvents.splice(eventIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/v1/bookings
  http.get('/api/v1/bookings', () => {
    return HttpResponse.json(mockBookings);
  }),

  // GET /api/v1/bookings/:id
  http.get('/api/v1/bookings/:id', ({ params }) => {
    const booking = mockBookings.find(b => b.id === params.id);
    if (!booking) {
      return HttpResponse.json(
        { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json(booking);
  }),

  // DELETE /api/v1/bookings/:id
  http.delete('/api/v1/bookings/:id', ({ params }) => {
    const bookingIndex = mockBookings.findIndex(b => b.id === params.id);
    if (bookingIndex === -1) {
      return HttpResponse.json(
        { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } },
        { status: 404 }
      );
    }
    
    mockBookings[bookingIndex].status = 'cancelled';
    return new HttpResponse(null, { status: 204 });
  }),
];
