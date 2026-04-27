import { Injectable } from '@nestjs/common';
import { Event } from '../core/domain/event';

@Injectable()
export class EventsRepository {
  private readonly byId = new Map<string, Event>();
  private readonly slugIndex = new Map<string, string>();

  list(): Event[] {
    return Array.from(this.byId.values()).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt),
    );
  }

  findById(id: string): Event | undefined {
    return this.byId.get(id);
  }

  findBySlug(slug: string): Event | undefined {
    const id = this.slugIndex.get(slug);
    return id ? this.byId.get(id) : undefined;
  }

  save(event: Event): void {
    const existing = this.byId.get(event.id);
    if (existing && existing.slug !== event.slug) {
      this.slugIndex.delete(existing.slug);
    }
    this.byId.set(event.id, event);
    this.slugIndex.set(event.slug, event.id);
  }

  delete(id: string): void {
    const existing = this.byId.get(id);
    if (!existing) return;
    this.byId.delete(id);
    this.slugIndex.delete(existing.slug);
  }
}
