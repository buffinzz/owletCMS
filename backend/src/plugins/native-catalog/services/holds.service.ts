import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hold, HoldStatus } from '../entities/hold.entity';
import { NativeCopy, CopyStatus } from '../entities/native-copy.entity';

@Injectable()
export class HoldsService {
  constructor(
    @InjectRepository(Hold)
    private holdRepository: Repository<Hold>,
    @InjectRepository(NativeCopy)
    private copyRepository: Repository<NativeCopy>,
  ) {}

  async placeHold(itemId: number, patronId: number): Promise<Hold> {
    const existingPending = await this.holdRepository.findOne({
      where: { itemId, patronId, status: HoldStatus.PENDING },
    });
    if (existingPending) throw new BadRequestException('You already have a hold on this item');

    const existingReady = await this.holdRepository.findOne({
      where: { itemId, patronId, status: HoldStatus.READY },
    });
    if (existingReady) throw new BadRequestException('You already have a hold on this item');

    const available = await this.copyRepository.findOneBy({
      itemId,
      status: CopyStatus.AVAILABLE,
    });

    if (available) {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.HOLD_EXPIRY_DAYS || '7'));

      await this.copyRepository.update(available.id, { status: CopyStatus.ON_HOLD });

      const readyHold = this.holdRepository.create({
        itemId,
        patronId,
        status: HoldStatus.READY,
        readyAt: now,
        notifiedAt: now,
        expiresAt,
        copyId: available.id,
      });
      return this.holdRepository.save(readyHold);
    }

    const hold = this.holdRepository.create({ itemId, patronId });
    return this.holdRepository.save(hold);
  }

  async cancelHold(holdId: number, patronId: number): Promise<void> {
    const hold = await this.holdRepository.findOneBy({ id: holdId });
    if (!hold) throw new BadRequestException('Hold not found');
    if (hold.patronId !== patronId) throw new BadRequestException('Unauthorized');
    await this.holdRepository.update(holdId, { status: HoldStatus.CANCELLED });
  }

  async fulfillHold(holdId: number): Promise<void> {
    await this.holdRepository.update(holdId, { status: HoldStatus.FULFILLED });
  }

  async expireHold(holdId: number): Promise<void> {
    const hold = await this.holdRepository.findOneBy({ id: holdId });
    if (hold?.copyId) {
      await this.copyRepository.update(hold.copyId, { status: CopyStatus.AVAILABLE });
    }
    await this.holdRepository.update(holdId, { status: HoldStatus.EXPIRED });
  }

  async findByPatron(patronId: number): Promise<Hold[]> {
    return this.holdRepository.find({
      where: { patronId },
      order: { requestedAt: 'DESC' },
    });
  }

  async findByItem(itemId: number): Promise<Hold[]> {
    return this.holdRepository.find({
      where: { itemId },
      order: { requestedAt: 'ASC' },
    });
  }

  async findAll(): Promise<Hold[]> {
    return this.holdRepository.find({
      where: { status: HoldStatus.PENDING },
      order: { requestedAt: 'ASC' },
    });
  }

  async findReady(): Promise<Hold[]> {
    return this.holdRepository.find({
      where: { status: HoldStatus.READY },
      order: { readyAt: 'ASC' },
    });
  }

  async getQueuePosition(itemId: number, patronId: number): Promise<number> {
    const holds = await this.holdRepository.find({
      where: { itemId, status: HoldStatus.PENDING },
      order: { requestedAt: 'ASC' },
    });
    const idx = holds.findIndex(h => h.patronId === patronId);
    return idx === -1 ? -1 : idx + 1;
  }
}
