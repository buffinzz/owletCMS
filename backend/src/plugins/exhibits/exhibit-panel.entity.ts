import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PanelType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TIMELINE = 'timeline',
  MAP = 'map',
  COLLECTION = 'collection',
}

export interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

@Entity()
export class ExhibitPanel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  exhibitId: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string; // markdown text

  @Column({
    type: 'enum',
    enum: PanelType,
    default: PanelType.TEXT,
  })
  type: PanelType;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ nullable: true })
  mediaAlt: string;

  @Column({ nullable: true })
  mediaCaption: string;

  @Column({ type: 'jsonb', nullable: true })
  timelineItems: TimelineItem[];

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  mapLat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  mapLng: number;

  @Column({ default: 13 })
  mapZoom: number;

  @Column({ nullable: true })
  mapLabel: string;

  @Column({ nullable: true })
  collectionId: number;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}