import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ExhibitType {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
  BOTH = 'both',
}

@Entity()
export class Exhibit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverUrl: string;

  @Column({ nullable: true })
  coverAlt: string;

  @Column({
    type: 'enum',
    enum: ExhibitType,
    default: ExhibitType.DIGITAL,
  })
  type: ExhibitType;

  @Column({ nullable: true })
  location: string; // physical location e.g. "Main Gallery, Floor 2"

  @Column({ nullable: true })
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}