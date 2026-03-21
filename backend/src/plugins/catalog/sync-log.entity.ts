import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column()
  synced: number;

  @Column()
  skipped: number;

  @Column({ nullable: true })
  error: string;

  @Column({ default: 'manual' })
  trigger: string; // 'manual' | 'scheduled'

  @CreateDateColumn()
  createdAt: Date;
}