import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { Event } from '../storage/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(private readonly storage: StorageService) {}

  findAll(): Event[] {
    return this.storage.findAllEvents();
  }

  findBySlug(slug: string): Event | undefined {
    return this.storage.findEventBySlug(slug);
  }

  create(dto: CreateEventDto): Event {
    if (this.storage.slugExists(dto.slug)) {
      throw new ConflictException({
        code: 'SLUG_TAKEN',
        message: 'Event with this slug already exists',
      });
    }

    const now = new Date().toISOString();
    const event: Event = {
      id: uuidv4(),
      ...dto,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.createEvent(event);
  }

  update(slug: string, dto: UpdateEventDto): Event {
    const event = this.storage.findEventBySlug(slug);
    if (!event) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    const updated = this.storage.updateEvent(slug, dto);
    if (!updated) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    return updated;
  }

  delete(slug: string): void {
    const event = this.storage.findEventBySlug(slug);
    if (!event) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }

    if (this.storage.hasActiveBookingsForEvent(event.id)) {
      throw new ConflictException({
        code: 'HAS_ACTIVE_BOOKINGS',
        message: 'Cannot delete event with active bookings',
      });
    }

    this.storage.deleteEvent(slug);
  }
}
