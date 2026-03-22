import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';
import { CollectionMembership, MemberEntityType } from './collection-membership.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private collectionsRepository: Repository<Collection>,
    @InjectRepository(CollectionMembership)
    private membershipRepository: Repository<CollectionMembership>,
  ) {}

  async findAll(): Promise<Collection[]> {
    return this.collectionsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findVisible(): Promise<Collection[]> {
    return this.collectionsRepository.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Collection | null> {
    return this.collectionsRepository.findOneBy({ id });
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    return this.collectionsRepository.findOneBy({ slug });
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
    await this.membershipRepository.delete({ collectionId: id });
    await this.collectionsRepository.delete(id);
  }

  // ── Membership ──
  async addMember(
    collectionId: number,
    entityType: MemberEntityType,
    entityId: number,
  ): Promise<CollectionMembership> {
    const existing = await this.membershipRepository.findOneBy({
      collectionId, entityType, entityId,
    });
    if (existing) return existing;
    const membership = this.membershipRepository.create({
      collectionId, entityType, entityId,
    });
    return this.membershipRepository.save(membership);
  }

  async removeMember(
    collectionId: number,
    entityType: MemberEntityType,
    entityId: number,
  ): Promise<void> {
    await this.membershipRepository.delete({ collectionId, entityType, entityId });
  }

  async getMemberships(collectionId: number): Promise<CollectionMembership[]> {
    return this.membershipRepository.find({
      where: { collectionId },
      order: { sortOrder: 'ASC', addedAt: 'ASC' },
    });
  }

  async getMembershipsByEntity(
    entityType: MemberEntityType,
    entityId: number,
  ): Promise<CollectionMembership[]> {
    return this.membershipRepository.find({
      where: { entityType, entityId },
    });
  }

  async getCollectionsByEntity(
    entityType: MemberEntityType,
    entityId: number,
  ): Promise<Collection[]> {
    const memberships = await this.getMembershipsByEntity(entityType, entityId);
    if (!memberships.length) return [];
    const ids = memberships.map(m => m.collectionId);
    return this.collectionsRepository
      .createQueryBuilder('collection')
      .whereInIds(ids)
      .getMany();
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
