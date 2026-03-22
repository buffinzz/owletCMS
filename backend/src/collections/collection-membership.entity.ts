import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum MemberEntityType {
  CATALOG_ITEM = 'catalog_item',
  PAGE = 'page',
  EVENT = 'event',
  DIGITAL_RESOURCE = 'digital_resource',
}

@Entity()
export class CollectionMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collectionId: number;

  @Column({
    type: 'enum',
    enum: MemberEntityType,
  })
  entityType: MemberEntityType;

  @Column()
  entityId: number;

  @Column({ nullable: true })
  sortOrder: number;

  @CreateDateColumn()
  addedAt: Date;
}
