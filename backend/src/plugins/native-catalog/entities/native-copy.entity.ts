import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CopyStatus {
  AVAILABLE = 'available',
  CHECKED_OUT = 'checked_out',
  ON_HOLD = 'on_hold',
  LOST = 'lost',
  WITHDRAWN = 'withdrawn',
}

export enum CopyCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity()
export class NativeCopy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number; // links to CollectionItem

  @Column({ nullable: true, unique: true })
  barcode: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  shelfLocation: string;

  @Column({
    type: 'enum',
    enum: CopyCondition,
    default: CopyCondition.GOOD,
  })
  condition: CopyCondition;

  @Column({
    type: 'enum',
    enum: CopyStatus,
    default: CopyStatus.AVAILABLE,
  })
  status: CopyStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}