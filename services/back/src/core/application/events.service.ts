import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../../dal/events.repo';
import { BookingsRepository } from '../../dal/bookings.repo';
import { Event } from '../domain/event';
import { DomainError } from '../domain/errors';
import { genId } from '../domain/ids';

export interface CreateEventInput {
  title: string;
  description: string;
  duration: number;
  slug: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  duration?: number;
  active?: boolean;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly events: EventsRepository,
    private readonly bookings: BookingsRepository,
  ) {}

  list(): Event[] {
    return this.events.list();
  }

  listActive(): Event[] {
    return this.events.list().filter((e) => e.active);
  }

  getBySlug(slug: string): Event {
    const event = this.events.findBySlug(slug);
    if (!event) {
      throw DomainError.notFound('EVENT_NOT_FOUND', `Event '${slug}' not found`);
    }
    return event;
  }

  getActiveBySlug(slug: string): Event {
    const event = this.getBySlug(slug);
    if (!event.active) {
      throw DomainError.notFound('EVENT_NOT_FOUND', `Event '${slug}' not found`);
    }
    return event;
  }

  create(input: CreateEventInput): Event {
    if (this.events.findBySlug(input.slug)) {
      throw DomainError.conflict(
        'SLUG_TAKEN',
        `Event with slug '${input.slug}' already exists`,
      );
    }
    const now = new Date().toISOString();
    const event: Event = {
      id: genId(),
      title: input.title,
      description: input.description,
      duration: input.duration,
      slug: input.slug,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.events.save(event);
    return event;
  }

  update(slug: string, input: UpdateEventInput): Event {
    const event = this.getBySlug(slug);
    const next: Event = {
      ...event,
      title: input.title ?? event.title,
      description: input.description ?? event.description,
      duration: input.duration ?? event.duration,
      active: input.active ?? event.active,
      updatedAt: new Date().toISOString(),
    };
    this.events.save(next);
    return next;
  }

  delete(slug: string): void {
    const event = this.getBySlug(slug);
    const active = this.bookings.listActiveByEventId(event.id);
    if (active.length > 0) {
      throw DomainError.conflict(
        'EVENT_HAS_BOOKINGS',
        `Cannot delete event with active bookings`,
      );
    }
    this.events.delete(event.id);
  }
}
