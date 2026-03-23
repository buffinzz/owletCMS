import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CirculationRecord } from '../entities/circulation-record.entity';
import { NativeCopy, CopyStatus } from '../entities/native-copy.entity';
import { Hold, HoldStatus } from '../entities/hold.entity';
import { EmailService } from './email.service';

@Injectable()
export class CirculationService {
  private readonly logger = new Logger(CirculationService.name);

  constructor(
    @InjectRepository(CirculationRecord)
    private circulationRepository: Repository<CirculationRecord>,
    @InjectRepository(NativeCopy)
    private copyRepository: Repository<NativeCopy>,
    @InjectRepository(Hold)
    private holdRepository: Repository<Hold>,
    private emailService: EmailService,
  ) {}

  private getLoanPeriodDays(): number {
    return parseInt(process.env.LOAN_PERIOD_DAYS || '21');
  }

  private getMaxRenewals(): number {
    return parseInt(process.env.MAX_RENEWALS || '2');
  }

  private getFinePerDay(): number {
    return parseFloat(process.env.OVERDUE_FINE_PER_DAY || '0');
  }

  // ── Checkout ──
  async checkout(
    copyId: number,
    patronId: number,
    staffId: number,
    patron: { email: string; displayName?: string; username: string },
  ): Promise<CirculationRecord> {
    const copy = await this.copyRepository.findOneBy({ id: copyId });
    if (!copy) throw new BadRequestException('Copy not found');
    if (copy.status !== CopyStatus.AVAILABLE) {
      throw new BadRequestException(`Copy is ${copy.status}`);
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this.getLoanPeriodDays());

    // Create circulation record
    const record = await this.circulationRepository.save(
      this.circulationRepository.create({
        copyId,
        itemId: copy.itemId,
        patronId,
        checkedOutBy: staffId,
        dueDate,
      })
    );

    // Update copy status
    await this.copyRepository.update(copyId, { status: CopyStatus.CHECKED_OUT });

    // Send confirmation email
    if (patron.email) {
      await this.emailService.sendCheckoutConfirmation(
        patronId,
        patron.email,
        patron.displayName || patron.username,
        `Item #${copy.itemId}`,
        dueDate,
        record.id,
      );
    }

    return record;
  }

  // ── Return ──
  async return(
    copyId: number,
    staffId: number,
  ): Promise<CirculationRecord> {
    const record = await this.circulationRepository.findOne({
      where: { copyId, returnedAt: IsNull() },
    });
    if (!record) throw new BadRequestException('No active checkout for this copy');

    const now = new Date();
    const fineAmount = this.calculateFine(record.dueDate, now);

    await this.circulationRepository.update(record.id, {
      returnedAt: now,
      returnedBy: staffId,
      isOverdue: now > record.dueDate,
      fineAmount,
    });

    // Check for waiting holds
    const nextHold = await this.holdRepository.findOne({
      where: { itemId: record.itemId, status: HoldStatus.PENDING },
      order: { requestedAt: 'ASC' },
    });

    if (nextHold) {
      await this.copyRepository.update(copyId, { status: CopyStatus.ON_HOLD });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.HOLD_EXPIRY_DAYS || '7'));
      await this.holdRepository.update(nextHold.id, {
        status: HoldStatus.READY,
        readyAt: now,
        expiresAt,
        copyId,
        notifiedAt: now,
      });
      // TODO: send hold ready email when patron data is available
    } else {
      await this.copyRepository.update(copyId, { status: CopyStatus.AVAILABLE });
    }

    return this.circulationRepository.findOneBy({ id: record.id }) as Promise<CirculationRecord>;
  }

  // ── Renew ──
  async renew(circulationId: number): Promise<CirculationRecord> {
    const record = await this.circulationRepository.findOneBy({ id: circulationId });
    if (!record) throw new BadRequestException('Circulation record not found');
    if (record.returnedAt) throw new BadRequestException('Item already returned');
    if (record.renewalCount >= this.getMaxRenewals()) {
      throw new BadRequestException(`Maximum renewals (${this.getMaxRenewals()}) reached`);
    }

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + this.getLoanPeriodDays());

    await this.circulationRepository.update(circulationId, {
      dueDate: newDueDate,
      renewalCount: record.renewalCount + 1,
    });

    return this.circulationRepository.findOneBy({ id: circulationId }) as Promise<CirculationRecord>;
  }

  private calculateFine(dueDate: Date, returnDate: Date): number {
    const finePerDay = this.getFinePerDay();
    if (finePerDay === 0 || returnDate <= dueDate) return 0;
    const daysOverdue = Math.floor(
      (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysOverdue * finePerDay;
  }

  // ── Queries ──
  async findActiveByPatron(patronId: number): Promise<CirculationRecord[]> {
    return this.circulationRepository.find({
      where: { patronId, returnedAt: IsNull() },
      order: { dueDate: 'ASC' },
    });
  }

  async findHistoryByPatron(patronId: number): Promise<CirculationRecord[]> {
    return this.circulationRepository.find({
      where: { patronId },
      order: { checkedOutAt: 'DESC' },
      take: 50,
    });
  }

  async findActiveByCopy(copyId: number): Promise<CirculationRecord | null> {
    return this.circulationRepository.findOne({
      where: { copyId, returnedAt: IsNull() },
    });
  }

  async findAll(): Promise<CirculationRecord[]> {
    return this.circulationRepository.find({
      where: { returnedAt: IsNull() },
      order: { dueDate: 'ASC' },
    });
  }

  async findOverdue(): Promise<CirculationRecord[]> {
    return this.circulationRepository
      .createQueryBuilder('record')
      .where('record.returnedAt IS NULL')
      .andWhere('record.dueDate < :now', { now: new Date() })
      .orderBy('record.dueDate', 'ASC')
      .getMany();
  }

  // ── Scheduled: daily reminders and overdue notices ──
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders(): Promise<void> {
    this.logger.log('Running daily circulation reminders...');
    const reminderDays = parseInt(process.env.REMINDER_DAYS_BEFORE || '3');

    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + reminderDays);

    // Find items due in N days
    const upcoming = await this.circulationRepository
      .createQueryBuilder('record')
      .where('record.returnedAt IS NULL')
      .andWhere('DATE(record.dueDate) = DATE(:date)', { date: reminderDate })
      .getMany();

    this.logger.log(`Found ${upcoming.length} upcoming due items`);
    // Note: full patron email lookup requires injecting UsersService
    // which we'll wire up when we build the controller
  }
}