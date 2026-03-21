import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CollectionItem } from './collection-item.entity';
import { CatalogProvider, CatalogItem } from './catalog.interface';
import { EvergreenProvider } from './providers/evergreen.provider';
import { SyncLog } from './sync-log.entity';

@Injectable()
export class CatalogService implements OnModuleInit {
  private readonly logger = new Logger(CatalogService.name);
  private provider: CatalogProvider | null = null;

  constructor(
    @InjectRepository(CollectionItem)
    private itemsRepository: Repository<CollectionItem>,
    @InjectRepository(SyncLog)
    private syncLogRepository: Repository<SyncLog>,
  ) {}

  onModuleInit() {
    this.initProvider();
  }

  private initProvider() {
    const providerType = process.env.CATALOG_PROVIDER;
    if (providerType === 'evergreen') {
      const feedUrl = process.env.EVERGREEN_URL;
      const libraryCode = process.env.EVERGREEN_LIBRARY_CODE;
      if (feedUrl && libraryCode) {
        this.provider = new EvergreenProvider(feedUrl, libraryCode);
        this.logger.log(`Catalog provider: Evergreen (${libraryCode})`);
      }
    }
    if (!this.provider) {
      this.logger.log('No catalog provider configured — using native only');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledSync() {
    this.logger.log('Running scheduled catalog sync...');
    await this.syncNewArrivals(
      process.env.CATALOG_SYNC_COUNT ? +process.env.CATALOG_SYNC_COUNT : 20,
      'scheduled'
    );
  }

  async syncNewArrivals(count: number = 20, trigger = 'manual'): Promise<{ synced: number; skipped: number }> {
    if (!this.provider) return { synced: 0, skipped: 0 };

    let synced = 0;
    let skipped = 0;
    let error: string | undefined;

    try {
      const items = await this.provider.fetchNewArrivals(count);

      for (const item of items) {
        const existing = await this.itemsRepository.findOneBy({
          sourceId: item.sourceId,
          source: item.source,
        });
        if (existing) { skipped++; continue; }
        await this.itemsRepository.save(
          this.itemsRepository.create({ ...item, isVisible: true })
        );
        synced++;
      }
    } catch (err) {
      error = err.message;
      this.logger.error('Sync failed', err);
    }

    await this.syncLogRepository.save(
      this.syncLogRepository.create({
        provider: this.provider.name,
        synced,
        skipped,
        error,
        trigger,
      })
    );

    this.logger.log(`Sync complete: ${synced} new, ${skipped} skipped`);
    return { synced, skipped };
  }

  async getSyncHistory(): Promise<SyncLog[]> {
    return this.syncLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async search(query: string, count: number = 10): Promise<CatalogItem[]> {
    if (!this.provider) return [];
    return this.provider.search(query, count);
  }

  async findNewArrivals(count: number = 10): Promise<CollectionItem[]> {
    return this.itemsRepository.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
      take: count,
    });
  }

  async findAll(filters?: {
    search?: string;
    source?: string;
    format?: string;
    visible?: string;
  }): Promise<CollectionItem[]> {
    const query = this.itemsRepository.createQueryBuilder('item');

    if (filters?.search) {
      query.andWhere(
        '(item.title ILIKE :search OR item.author ILIKE :search OR item.isbn ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    if (filters?.source) {
      query.andWhere('item.source = :source', { source: filters.source });
    }
    if (filters?.format) {
      query.andWhere('item.format = :format', { format: filters.format });
    }
    if (filters?.visible !== undefined) {
      query.andWhere('item.isVisible = :visible', { visible: filters.visible === 'true' });
    }

    query.orderBy('item.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: number): Promise<CollectionItem | null> {
    return this.itemsRepository.findOneBy({ id });
  }

  async create(data: Partial<CollectionItem>): Promise<CollectionItem> {
    const item = this.itemsRepository.create({ ...data, source: 'native' });
    return this.itemsRepository.save(item);
  }

  async update(id: number, data: Partial<CollectionItem>): Promise<CollectionItem | null> {
    await this.itemsRepository.update(id, data);
    return this.itemsRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.itemsRepository.delete(id);
  }

  async bulkDelete(ids: number[]): Promise<void> {
    await this.itemsRepository.delete(ids);
  }

  async bulkToggleVisibility(ids: number[], isVisible: boolean): Promise<void> {
    await this.itemsRepository
      .createQueryBuilder()
      .update(CollectionItem)
      .set({ isVisible })
      .whereInIds(ids)
      .execute();
  }
}
