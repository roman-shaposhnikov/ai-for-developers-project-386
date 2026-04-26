import { api, unwrap, unwrapVoid } from '@/shared/api';
import type { CreateEventRequest, Event, UpdateEventRequest } from './model';

export const eventKeys = {
  all: ['events'] as const,
  publicList: () => ['events', 'public'] as const,
  publicDetail: (slug: string) => ['events', 'public', slug] as const,
  adminList: () => ['events', 'admin'] as const,
  adminDetail: (slug: string) => ['events', 'admin', slug] as const,
};

export async function listPublicEvents(): Promise<Event[]> {
  return unwrap(await api.GET('/api/v1/public/events'));
}

export async function getPublicEvent(slug: string): Promise<Event> {
  return unwrap(await api.GET('/api/v1/public/events/{slug}', { params: { path: { slug } } }));
}

export async function listAdminEvents(): Promise<Event[]> {
  return unwrap(await api.GET('/api/v1/events'));
}

export async function getAdminEvent(slug: string): Promise<Event> {
  return unwrap(await api.GET('/api/v1/events/{slug}', { params: { path: { slug } } }));
}

export async function createEvent(body: CreateEventRequest): Promise<Event> {
  return unwrap(await api.POST('/api/v1/events', { body }));
}

export async function updateEvent(slug: string, body: UpdateEventRequest): Promise<Event> {
  return unwrap(
    await api.PATCH('/api/v1/events/{slug}', { params: { path: { slug } }, body }),
  );
}

export async function deleteEvent(slug: string): Promise<void> {
  unwrapVoid(await api.DELETE('/api/v1/events/{slug}', { params: { path: { slug } } }));
}
