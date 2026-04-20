import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from '../storage/entities/event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(): Event[] {
    return this.eventsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Event {
    const event = this.eventsService.findBySlug(slug);
    if (!event) {
      throw new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'Event not found',
      });
    }
    return event;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto): Event {
    return this.eventsService.create(dto);
  }

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateEventDto,
  ): Event {
    return this.eventsService.update(slug, dto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): void {
    this.eventsService.delete(slug);
  }
}
