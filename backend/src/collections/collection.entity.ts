import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
