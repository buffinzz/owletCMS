import {
  Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PatronProfile {
  @PrimaryColumn()
  userId: number; // 1:1 with User — userId is the PK

  @Column({ nullable: true, unique: true })
  libraryCardNumber: string;

  @Column({ nullable: true })
  preferredName: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ default: true })
  notifyByEmail: boolean;

  @Column({ type: 'jsonb', nullable: true })
  readingInterests: string[];

  @Column({ default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string; // staff notes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
