import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum HoldStatus {
  PENDING = 'pending',
  READY = 'ready',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity()
export class Hold {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number; // CollectionItem id

  @Column()
  patronId: number;

  @Column({
    type: 'enum',
    enum: HoldStatus,
    default: HoldStatus.PENDING,
  })
  status: HoldStatus;

  @Column({ nullable: true })
  notifiedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  readyAt: Date;

  @Column({ nullable: true })
  copyId: number; // assigned when ready

  @CreateDateColumn()
  requestedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}