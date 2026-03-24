import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum EmailType {
  WELCOME = 'welcome',
  DUE_REMINDER = 'due_reminder',
  OVERDUE = 'overdue',
  HOLD_READY = 'hold_ready',
  CHECKOUT = 'checkout',
  RETURN = 'return',
}

@Entity()
export class EmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patronId: number;

  @Column({
    type: 'enum',
    enum: EmailType,
  })
  type: EmailType;

  @Column()
  subject: string;

  @Column({ nullable: true })
  relatedId: number; // circulation or hold id

  @Column({ default: false })
  failed: boolean;

  @Column({ type: 'text', nullable: true })
  error: string;

  @CreateDateColumn()
  sentAt: Date;
}