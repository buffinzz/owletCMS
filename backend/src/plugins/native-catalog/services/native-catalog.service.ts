import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NativeCopy, CopyStatus } from '../entities/native-copy.entity';

export const ITEM_FORMATS = [
  'book', 'dvd', 'audiobook', 'magazine',
  'boardgame', 'equipment', 'seed', 'other'
];

@Injectable()
export class NativeCatalogService {
  private readonly logger = new Logger(NativeCatalogService.name);

  constructor(
    @InjectRepository(NativeCopy)
    private copyRepository: Repository<NativeCopy>,
  ) {}

  // ── ISBN Lookup via Open Library ──
  async lookupIsbn(isbn: string): Promise<any> {
    try {
      const clean = isbn.replace(/[-\s]/g, '');
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
      );
      const data = await res.json();
      const key = `ISBN:${clean}`;
      if (!data[key]) return null;

      const book = data[key];
      return {
        title: book.title,
        author: book.authors?.[0]?.name,
        publisher: book.publishers?.[0]?.name,
        publishedYear: book.publish_date,
        description: book.notes?.value || book.notes || '',
        coverUrl: book.cover?.medium || book.cover?.small,
        subjects: book.subjects?.slice(0, 10).map((s: any) => s.name || s) || [],
        isbn: clean,
      };
    } catch (err) {
      this.logger.error(`ISBN lookup failed: ${err.message}`);
      return null;
    }
  }

  // ── Copies ──
  async findCopiesByItem(itemId: number): Promise<NativeCopy[]> {
    return this.copyRepository.find({
      where: { itemId },
      order: { createdAt: 'ASC' },
    });
  }

  async findCopyById(id: number): Promise<NativeCopy | null> {
    return this.copyRepository.findOneBy({ id });
  }

  async findCopyByBarcode(barcode: string): Promise<NativeCopy | null> {
    return this.copyRepository.findOneBy({ barcode });
  }

  async createCopy(data: Partial<NativeCopy>): Promise<NativeCopy> {
    if (!data.barcode) {
      data.barcode = await this.generateBarcode();
    }
    const copy = this.copyRepository.create(data);
    return this.copyRepository.save(copy);
  }

  async updateCopy(id: number, data: Partial<NativeCopy>): Promise<NativeCopy | null> {
    await this.copyRepository.update(id, data);
    return this.copyRepository.findOneBy({ id });
  }

  async removeCopy(id: number): Promise<void> {
    await this.copyRepository.delete(id);
  }

  async getAvailableCopy(itemId: number): Promise<NativeCopy | null> {
    return this.copyRepository.findOneBy({
      itemId,
      status: CopyStatus.AVAILABLE,
    });
  }

  private async generateBarcode(): Promise<string> {
    const count = await this.copyRepository.count();
    return `OWL${String(count + 1).padStart(6, '0')}`;
  }

  async findAllCopies(): Promise<NativeCopy[]> {
    return this.copyRepository.find({ order: { createdAt: 'DESC' } });
  }
}