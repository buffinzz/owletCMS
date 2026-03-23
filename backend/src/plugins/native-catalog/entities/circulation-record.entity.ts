import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class CirculationRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  copyId: number;

  @Column()
  itemId: number; // denormalized for easy querying

  @Column()
  patronId: number;

  @Column({ nullable: true })
  checkedOutBy: number; // staff user

  @CreateDateColumn()
  checkedOutAt: Date;

  @Column()
  dueDate: Date;

  @Column({ nullable: true })
  returnedAt: Date;

  @Column({ nullable: true })
  returnedBy: number; // staff user

  @Column({ default: 0 })
  renewalCount: number;

  @Column({ default: false })
  isOverdue: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fineAmount: number;

  @Column({ default: false })
  finePaid: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @UpdateDateColumn()
  updatedAt: Date;
}