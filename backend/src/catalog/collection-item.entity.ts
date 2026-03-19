import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class CollectionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true, unique: true })
  isbn: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  publishedDate: string;

  @Column({ nullable: true })
  publisher: string;

  @Column({ nullable: true })
  externalUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  subjects: string[];

  @Column({ nullable: true })
  format: string;

  @Column({ default: 'native' })
  source: string; // 'native' | 'evergreen' | 'koha' etc

  @Column({ nullable: true })
  sourceId: string; // ID in the source system

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}