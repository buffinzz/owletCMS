import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ResourceCategory {
  EBOOK = 'ebook',
  DATABASE = 'database',
  STREAMING = 'streaming',
  TOOL = 'tool',
  LOCAL = 'local',
  GOVERNMENT = 'government',
  OTHER = 'other',
}

@Entity()
export class DigitalResource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  url: string; // external URL

  @Column({ nullable: true })
  mediaId: number; // uploaded file from media library

  @Column({
    type: 'enum',
    enum: ResourceCategory,
    default: ResourceCategory.OTHER,
  })
  category: ResourceCategory;

  @Column({ nullable: true })
  icon: string; // emoji or icon name

  @Column({ type: 'text', nullable: true })
  accessInstructions: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  coverAlt: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  requiresCardNumber: boolean; // some databases need library card

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
