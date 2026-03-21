import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { CollectionItem } from './collection-item.entity';

@Entity()
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  coverAlt: string;

  @Column({ nullable: true })
  coverTitle: string;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'jsonb', nullable: true })
  linkedEntities: Array<{ type: 'event' | 'page'; id: number }>;

  @ManyToMany(() => CollectionItem, { eager: false })
  @JoinTable()
  items: CollectionItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

}
