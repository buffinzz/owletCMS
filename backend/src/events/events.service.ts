import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
  ) {}

  findAll(): Promise<Event[]> {
    return this.eventsRepository.find({
      where: { isPublished: true },
      order: { startDate: 'ASC' },
    });
  }

  findOne(slug: string): Promise<Event | null> {
    return this.eventsRepository.findOneBy({ slug });
  }

  create(event: Partial<Event>): Promise<Event> {
    const newEvent = this.eventsRepository.create(event);
    return this.eventsRepository.save(newEvent);
  }
}