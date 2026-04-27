import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { EventsService } from '../../core/application/events.service';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { Event } from '../../core/domain/event';

@Controller('events')
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(): Event[] {
    return this.events.list();
  }

  @Post()
  @HttpCode(201)
  create(@Body() body: CreateEventDto): Event {
    return this.events.create(body);
  }

  @Get(':slug')
  read(@Param('slug') slug: string): Event {
    return this.events.getBySlug(slug);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() body: UpdateEventDto): Event {
    return this.events.update(slug, body);
  }

  @Delete(':slug')
  @HttpCode(204)
  delete(@Param('slug') slug: string): void {
    this.events.delete(slug);
  }
}
