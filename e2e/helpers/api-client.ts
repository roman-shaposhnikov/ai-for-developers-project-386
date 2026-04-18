/**
 * API Client для взаимодействия с бэкендом в тестах
 */

import type { APIRequestContext } from '@playwright/test';
import type { 
  BookingCreatedResponse,
  BookingWithEvent,
  CreateBookingRequest,
  CreateEventRequest, 
  Event, 
  SlotsResponse,
  UpdateEventRequest, 
  WeeklySchedule, 
} from '../fixtures/types';

const API_BASE_URL = process.env['API_URL'] || 'http://localhost:3000/api/v1';

export interface ApiClientOptions {
  auth?: {
    username: string;
    password: string;
  };
}

export class ApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private auth: { username: string; password: string } | undefined;

  constructor(request: APIRequestContext, options: ApiClientOptions = {}) {
    this.request = request;
    this.baseUrl = API_BASE_URL;
    this.auth = options.auth ?? undefined;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.auth) {
      const auth = Buffer.from(`${this.auth.username}:${this.auth.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  // ─── Admin: Events ───

  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await this.request.post(`${this.baseUrl}/events`, {
      headers: this.getHeaders(),
      data,
    });

    if (response.status() !== 201) {
      const body = await response.text();
      throw new Error(`Failed to create event: ${response.status()} - ${body}`);
    }

    return response.json();
  }

  async listEvents(): Promise<Event[]> {
    const response = await this.request.get(`${this.baseUrl}/events`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to list events: ${response.status()}`);
    }

    return response.json();
  }

  async getEvent(slug: string): Promise<Event> {
    const response = await this.request.get(`${this.baseUrl}/events/${slug}`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to get event: ${response.status()}`);
    }

    return response.json();
  }

  async updateEvent(slug: string, data: UpdateEventRequest): Promise<Event> {
    const response = await this.request.patch(`${this.baseUrl}/events/${slug}`, {
      headers: this.getHeaders(),
      data,
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to update event: ${response.status()}`);
    }

    return response.json();
  }

  async deleteEvent(slug: string): Promise<void> {
    const response = await this.request.delete(`${this.baseUrl}/events/${slug}`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(`Failed to delete event: ${response.status()}`);
    }
  }

  // ─── Admin: Schedule ───

  async getSchedule(): Promise<WeeklySchedule> {
    const response = await this.request.get(`${this.baseUrl}/schedule`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to get schedule: ${response.status()}`);
    }

    return response.json();
  }

  async updateSchedule(schedule: WeeklySchedule): Promise<WeeklySchedule> {
    const response = await this.request.put(`${this.baseUrl}/schedule`, {
      headers: this.getHeaders(),
      data: schedule,
    });

    if (response.status() !== 200) {
      const body = await response.text();
      throw new Error(`Failed to update schedule: ${response.status()} - ${body}`);
    }

    return response.json();
  }

  // ─── Admin: Bookings ───

  async listBookings(): Promise<BookingWithEvent[]> {
    const response = await this.request.get(`${this.baseUrl}/bookings`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to list bookings: ${response.status()}`);
    }

    return response.json();
  }

  async getBooking(id: string): Promise<BookingWithEvent> {
    const response = await this.request.get(`${this.baseUrl}/bookings/${id}`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 200) {
      throw new Error(`Failed to get booking: ${response.status()}`);
    }

    return response.json();
  }

  async cancelBookingAsAdmin(id: string): Promise<void> {
    const response = await this.request.delete(`${this.baseUrl}/bookings/${id}`, {
      headers: this.getHeaders(),
    });

    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(`Failed to cancel booking: ${response.status()}`);
    }
  }

  // ─── Public: Events ───

  async listPublicEvents(): Promise<Event[]> {
    const response = await this.request.get(`${this.baseUrl}/public/events`);

    if (response.status() !== 200) {
      throw new Error(`Failed to list public events: ${response.status()}`);
    }

    return response.json();
  }

  async getPublicEvent(slug: string): Promise<Event> {
    const response = await this.request.get(`${this.baseUrl}/public/events/${slug}`);

    if (response.status() !== 200) {
      throw new Error(`Failed to get public event: ${response.status()}`);
    }

    return response.json();
  }

  async getSlots(slug: string, date: string): Promise<SlotsResponse> {
    const response = await this.request.get(
      `${this.baseUrl}/public/events/${slug}/slots?date=${date}`
    );

    if (response.status() !== 200) {
      throw new Error(`Failed to get slots: ${response.status()}`);
    }

    return response.json();
  }

  // ─── Public: Bookings ───

  async createBooking(
    slug: string, 
    data: CreateBookingRequest
  ): Promise<BookingCreatedResponse> {
    const response = await this.request.post(
      `${this.baseUrl}/public/events/${slug}/bookings`,
      {
        headers: { 'Content-Type': 'application/json' },
        data,
      }
    );

    if (response.status() !== 201) {
      const body = await response.text();
      throw new Error(`Failed to create booking: ${response.status()} - ${body}`);
    }

    return response.json();
  }

  async cancelBookingAsGuest(id: string, cancelToken: string): Promise<void> {
    const response = await this.request.delete(
      `${this.baseUrl}/public/bookings/${id}?cancelToken=${cancelToken}`
    );

    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(`Failed to cancel booking: ${response.status()}`);
    }
  }
}

/**
 * Создаёт API клиент для тестов
 */
export function createApiClient(
  request: APIRequestContext, 
  auth?: { username: string; password: string }
): ApiClient {
  return new ApiClient(request, auth ? { auth } : {});
}
