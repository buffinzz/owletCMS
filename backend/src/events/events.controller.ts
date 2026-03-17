import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(): Promise<Event[]> {
    return this.eventsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<Event | null> {
    return this.eventsService.findOne(slug);
  }

  @Post()
  create(@Body() event: Partial<Event>): Promise<Event> {
    return this.eventsService.create(event);
  }
}