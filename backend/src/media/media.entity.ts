import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimetype: string;

  @Column()
  size: number;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  alt: string;

  @Column({ nullable: true })
  url: string; // for external URLs — bridge to Digital Resources

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'text', nullable: true })
  ocrText: string;

  @Column({ default: false })
  isIndexed: boolean;

  @Column({ nullable: true })
  uploadedBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
