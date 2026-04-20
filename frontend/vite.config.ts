import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import type { Connect } from 'vite';

// Хранилище для консольных логов
const consoleLogs: Array<{type: string, args: string[], timestamp: string}> = []

// Mock data
const mockEvents = [
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

const mockBookings = [
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
];

// Generate time slots
function generateSlots(date: string, duration: number) {
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
      const endHour = hour + Math.floor((minute + duration) / 60);
      const endMinute = (minute + duration) % 60;
      const endTime = `${date}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00Z`;
      slots.push({ startTime, endTime });
    }
  }
  return { date, eventSlug: 'test', duration, slots };
}

// Send JSON response
function sendJson(res: any, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Create API middleware
function createApiMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url || '';
    const method = req.method || 'GET';
    
    // Skip non-API routes
    if (!url.startsWith('/api/')) {
      return next();
    }

    // Skip console-logs API
    if (url === '/api/console-logs') {
      return next();
    }

    console.log(`[API] ${method} ${url}`);

    const urlObj = new URL(url, 'http://localhost:8080');
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // ========== Public API ==========
    
    // GET /api/v1/public/events
    if (pathname === '/api/v1/public/events' && method === 'GET') {
      return sendJson(res, mockEvents.filter(e => e.active));
    }

    // GET /api/v1/public/events/:slug
    const publicEventMatch = pathname.match(/^\/api\/v1\/public\/events\/([^\/]+)$/);
    if (publicEventMatch && method === 'GET') {
      const slug = publicEventMatch[1];
      const event = mockEvents.find(e => e.slug === slug && e.active);
      if (!event) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      return sendJson(res, event);
    }

    // GET /api/v1/public/events/:slug/slots
    const slotsMatch = pathname.match(/^\/api\/v1\/public\/events\/([^\/]+)\/slots$/);
    if (slotsMatch && method === 'GET') {
      const slug = slotsMatch[1];
      const date = searchParams.get('date');
      const event = mockEvents.find(e => e.slug === slug && e.active);
      if (!event) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      if (!date) {
        return sendJson(res, { error: { code: 'INVALID_REQUEST', message: 'Date parameter required' } }, 400);
      }
      return sendJson(res, generateSlots(date, event.duration));
    }

    // POST /api/v1/public/events/:slug/bookings
    const publicBookingMatch = pathname.match(/^\/api\/v1\/public\/events\/([^\/]+)\/bookings$/);
    if (publicBookingMatch && method === 'POST') {
      const slug = publicBookingMatch[1];
      const event = mockEvents.find(e => e.slug === slug && e.active);
      if (!event) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      
      // Read body
      let body = '';
      req.on('data', chunk => body += chunk);
      await new Promise(resolve => req.on('end', resolve));
      
      const data = JSON.parse(body);
      const booking = {
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
      
      return sendJson(res, booking, 201);
    }

    // DELETE /api/v1/public/bookings/:id
    const publicCancelMatch = pathname.match(/^\/api\/v1\/public\/bookings\/([^\/]+)$/);
    if (publicCancelMatch && method === 'DELETE') {
      const id = publicCancelMatch[1];
      const cancelToken = searchParams.get('cancelToken');
      const bookingIndex = mockBookings.findIndex(b => b.id === id);
      
      if (bookingIndex === -1) {
        return sendJson(res, { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } }, 404);
      }
      if (!cancelToken) {
        return sendJson(res, { error: { code: 'INVALID_TOKEN', message: 'Cancel token required' } }, 400);
      }
      
      mockBookings[bookingIndex].status = 'cancelled';
      res.statusCode = 204;
      return res.end();
    }

    // ========== Admin API ==========

    // GET /api/v1/events
    if (pathname === '/api/v1/events' && method === 'GET') {
      return sendJson(res, mockEvents);
    }

    // GET /api/v1/events/:slug
    const adminEventMatch = pathname.match(/^\/api\/v1\/events\/([^\/]+)$/);
    if (adminEventMatch && method === 'GET') {
      const slug = adminEventMatch[1];
      const event = mockEvents.find(e => e.slug === slug);
      if (!event) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      return sendJson(res, event);
    }

    // POST /api/v1/events
    if (pathname === '/api/v1/events' && method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      await new Promise(resolve => req.on('end', resolve));
      
      const data = JSON.parse(body);
      
      if (mockEvents.some(e => e.slug === data.slug)) {
        return sendJson(res, { error: { code: 'DUPLICATE_SLUG', message: 'Event with this slug already exists' } }, 409);
      }
      
      const event = {
        id: `${mockEvents.length + 1}`,
        ...data,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockEvents.push(event);
      return sendJson(res, event, 201);
    }

    // PATCH /api/v1/events/:slug
    if (adminEventMatch && method === 'PATCH') {
      const slug = adminEventMatch[1];
      const eventIndex = mockEvents.findIndex(e => e.slug === slug);
      if (eventIndex === -1) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      
      let body = '';
      req.on('data', chunk => body += chunk);
      await new Promise(resolve => req.on('end', resolve));
      
      const data = JSON.parse(body);
      mockEvents[eventIndex] = {
        ...mockEvents[eventIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return sendJson(res, mockEvents[eventIndex]);
    }

    // DELETE /api/v1/events/:slug
    if (adminEventMatch && method === 'DELETE') {
      const slug = adminEventMatch[1];
      const eventIndex = mockEvents.findIndex(e => e.slug === slug);
      if (eventIndex === -1) {
        return sendJson(res, { error: { code: 'EVENT_NOT_FOUND', message: 'Event not found' } }, 404);
      }
      mockEvents.splice(eventIndex, 1);
      res.statusCode = 204;
      return res.end();
    }

    // GET /api/v1/bookings
    if (pathname === '/api/v1/bookings' && method === 'GET') {
      return sendJson(res, mockBookings);
    }

    // GET /api/v1/bookings/:id
    const adminBookingMatch = pathname.match(/^\/api\/v1\/bookings\/([^\/]+)$/);
    if (adminBookingMatch && method === 'GET') {
      const id = adminBookingMatch[1];
      const booking = mockBookings.find(b => b.id === id);
      if (!booking) {
        return sendJson(res, { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } }, 404);
      }
      return sendJson(res, booking);
    }

    // DELETE /api/v1/bookings/:id
    if (adminBookingMatch && method === 'DELETE') {
      const id = adminBookingMatch[1];
      const bookingIndex = mockBookings.findIndex(b => b.id === id);
      if (bookingIndex === -1) {
        return sendJson(res, { error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found' } }, 404);
      }
      mockBookings[bookingIndex].status = 'cancelled';
      res.statusCode = 204;
      return res.end();
    }

    // Unknown endpoint
    return sendJson(res, { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }, 404);
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      react: "react",
      "react-dom": "react-dom",
    },
    dedupe: ["react", "react-dom"],
  },
  plugins: [
    react(),
    {
      name: 'api-middleware',
      configureServer(server) {
        // Add API middleware before other middlewares
        server.middlewares.use(createApiMiddleware());
      }
    },
    {
      name: 'health-check',
      configureServer(server) {
        // Health check endpoint
        server.middlewares.use('/healthcheck', (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }))
          } else {
            next()
          }
        })
      }
    },
    {
      name: 'console-logs-api',
      configureServer(server) {
        // API для получения логов
        server.middlewares.use('/api/console-logs', (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ logs: consoleLogs }))
          } else if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => body += chunk)
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                if (data.logs && Array.isArray(data.logs)) {
                  consoleLogs.push(...data.logs)
                  if (consoleLogs.length > 1000) {
                    consoleLogs.splice(0, consoleLogs.length - 1000)
                  }
                }
              } catch (e) {
                // ignore parse errors
              }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            })
          } else {
            next()
          }
        })
      }
    }
  ],
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    cors: true,
    hmr: {
      host: "0.0.0.0",
      port: 8080,
      protocol: "ws",
    },
  },
})
