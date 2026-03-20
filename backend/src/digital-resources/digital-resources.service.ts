import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalResource } from './digital-resource.entity';

@Injectable()
export class DigitalResourcesService {
  constructor(
    @InjectRepository(DigitalResource)
    private resourcesRepository: Repository<DigitalResource>,
  ) {}

  async findAll(): Promise<DigitalResource[]> {
    return this.resourcesRepository.find({
      order: { category: 'ASC', title: 'ASC' },
    });
  }

  async findVisible(): Promise<DigitalResource[]> {
    return this.resourcesRepository.find({
      where: { isVisible: true },
      order: { category: 'ASC', title: 'ASC' },
    });
  }

  async findByCategory(category: string): Promise<DigitalResource[]> {
    return this.resourcesRepository.find({
      where: { category: category as any, isVisible: true },
      order: { title: 'ASC' },
    });
  }

  async findOne(id: number): Promise<DigitalResource | null> {
    return this.resourcesRepository.findOneBy({ id });
  }

  async findBySlug(slug: string): Promise<DigitalResource | null> {
    return this.resourcesRepository.findOneBy({ slug });
  }

  async create(data: Partial<DigitalResource>): Promise<DigitalResource> {
    const resource = this.resourcesRepository.create(data);
    return this.resourcesRepository.save(resource);
  }

  async update(id: number, data: Partial<DigitalResource>): Promise<DigitalResource | null> {
    await this.resourcesRepository.update(id, data);
    return this.resourcesRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.resourcesRepository.delete(id);
  }
}