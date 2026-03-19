import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';
import { CollectionItem } from './collection-item.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
    @InjectRepository(CollectionItem)
    private itemsRepository: Repository<CollectionItem>,
  ) {}

  async findAll(): Promise<Collection[]> {
    return this.collectionsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findVisible(): Promise<Collection[]> {
    return this.collectionsRepository.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Collection | null> {
    return this.collectionsRepository.findOne({
      where: { id },
      relations: ['items'],
    });
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    return this.collectionsRepository.findOne({
      where: { slug },
      relations: ['items'],
    });
  }

  async create(data: Partial<Collection>): Promise<Collection> {
    const collection = this.collectionsRepository.create(data);
    return this.collectionsRepository.save(collection);
  }

  async update(id: number, data: Partial<Collection>): Promise<Collection | null> {
    await this.collectionsRepository.update(id, data);
    return this.collectionsRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.collectionsRepository.delete(id);
  }

  async addItem(collectionId: number, itemId: number): Promise<Collection | null> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId },
      relations: ['items'],
    });
    const item = await this.itemsRepository.findOneBy({ id: itemId });
    if (!collection || !item) return null;
    collection.items = [...(collection.items || []), item];
    return this.collectionsRepository.save(collection);
  }

  async removeItem(collectionId: number, itemId: number): Promise<Collection | null> {
    const collection = await this.collectionsRepository.findOne({
      where: { id: collectionId },
      relations: ['items'],
    });
    if (!collection) return null;
    collection.items = collection.items.filter(i => i.id !== itemId);
    return this.collectionsRepository.save(collection);
  }

  async bulkToggleVisibility(ids: number[], isVisible: boolean): Promise<void> {
    await this.collectionsRepository
      .createQueryBuilder()
      .update(Collection)
      .set({ isVisible })
      .whereInIds(ids)
      .execute();
  }
}
