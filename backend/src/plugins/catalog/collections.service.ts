import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionsService as CoreCollectionsService } from '../../collections/collections.service';
import { CollectionItem } from './collection-item.entity';
import { MemberEntityType } from '../../collections/collection-membership.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(CollectionItem)
    private itemsRepository: Repository<CollectionItem>,
    private coreCollectionsService: CoreCollectionsService,
  ) {}

  // Augments core collection with catalog items
  async findOne(id: number) {
    const collection = await this.coreCollectionsService.findOne(id);
    if (!collection) return null;

    const memberships = await this.coreCollectionsService.getMemberships(id);
    const catalogMemberships = memberships.filter(
      m => m.entityType === MemberEntityType.CATALOG_ITEM
    );

    const items = await Promise.all(
      catalogMemberships.map(m => this.itemsRepository.findOneBy({ id: m.entityId }))
    );

    return { ...collection, items: items.filter(Boolean) };
  }

  // Augments core collection with catalog items
  async findBySlug(slug: string) {
    const collection = await this.coreCollectionsService.findBySlug(slug);
    if (!collection) return null;

    const memberships = await this.coreCollectionsService.getMemberships(collection.id);
    const catalogMemberships = memberships.filter(
      m => m.entityType === MemberEntityType.CATALOG_ITEM
    );

    const items = await Promise.all(
      catalogMemberships.map(m => this.itemsRepository.findOneBy({ id: m.entityId }))
    );

    return { ...collection, items: items.filter(Boolean) };
  }

  // Which collections does this catalog item belong to?
  async findByItem(itemId: number) {
    return this.coreCollectionsService.getCollectionsByEntity(
      MemberEntityType.CATALOG_ITEM,
      itemId,
    );
  }

  // Add a catalog item to a collection
  async addItem(collectionId: number, itemId: number): Promise<void> {
    await this.coreCollectionsService.addMember(
      collectionId,
      MemberEntityType.CATALOG_ITEM,
      itemId,
    );
  }

  // Remove a catalog item from a collection
  async removeItem(collectionId: number, itemId: number): Promise<void> {
    await this.coreCollectionsService.removeMember(
      collectionId,
      MemberEntityType.CATALOG_ITEM,
      itemId,
    );
  }
}