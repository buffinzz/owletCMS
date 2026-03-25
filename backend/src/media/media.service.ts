import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './media.entity';
import { OcrService } from './ocr.service';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private ocrService: OcrService,
  ) {}

  async save(file: Express.Multer.File, uploadedBy: number): Promise<Media> {
    const cleanName = file.originalname
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.\-_]/g, '')
      .replace(/-+/g, '-')
      .toLowerCase();

    const media = this.mediaRepository.create({
      filename: file.filename,
      originalName: cleanName,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy,
    });
    const saved = await this.mediaRepository.save(media);
    this.runOcr(saved).catch(err => this.logger.error('OCR error', err));
    return saved;
  }

  private async runOcr(media: Media): Promise<void> {
    const shouldIndex = (
      media.mimetype.startsWith('image/') ||
      media.mimetype === 'application/pdf' ||
      media.mimetype.includes('word') ||
      media.mimetype.startsWith('text/')
    );

    this.logger.log(`OCR check: ${media.originalName} (${media.mimetype}) shouldIndex=${shouldIndex}`);

    if (!shouldIndex) return;

    this.logger.log(`Starting OCR for ${media.originalName}...`);
    const text = await this.ocrService.extractText(media.filename, media.mimetype);
    this.logger.log(`OCR result for ${media.originalName}: ${text ? text.length + ' chars' : 'null'}`);
    
    if (text) {
      await this.mediaRepository.update(media.id, {
        ocrText: text,
        isIndexed: true,
      });
      this.logger.log(`Indexed ${media.originalName}`);
    }
  }

  async findAll(search?: string): Promise<Media[]> {
    if (!search) {
      return this.mediaRepository.find({ order: { createdAt: 'DESC' } });
    }

    // Full-text search across all text fields
    return this.mediaRepository
      .createQueryBuilder('media')
      .where(
        `(
          media.title ILIKE :search OR
          media.originalName ILIKE :search OR
          media.alt ILIKE :search OR
          media.description ILIKE :search OR
          media.ocrText ILIKE :search OR
          media.tags::text ILIKE :search
        )`,
        { search: `%${search}%` }
      )
      .orderBy('media.createdAt', 'DESC')
      .getMany();
  }
  async saveExternal(data: {
    url: string;
    title?: string;
    alt?: string;
    description?: string;
    mimetype?: string;
    tags?: string[];
  }, uploadedBy: number): Promise<Media> {
    const media = this.mediaRepository.create({
      filename: 'external',
      originalName: data.title || data.url,
      mimetype: data.mimetype || this.guessMimetype(data.url),
      size: 0,
      url: data.url,
      title: data.title,
      alt: data.alt,
      description: data.description,
      tags: data.tags,
      isIndexed: false,
      uploadedBy,
    });
    return this.mediaRepository.save(media);
  }

  private guessMimetype(url: string): string {
    if (/youtube\.com|youtu\.be|vimeo\.com/.test(url)) return 'video/external';
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url)) return 'image/external';
    if (/\.(mp3|wav|ogg)(\?|$)/i.test(url)) return 'audio/external';
    if (/\.(pdf)(\?|$)/i.test(url)) return 'application/pdf';
    return 'text/uri-list';
  }
  async update(id: number, data: Partial<Media>): Promise<Media | null> {
    await this.mediaRepository.update(id, data);
    return this.mediaRepository.findOneBy({ id });
  }

  async reindex(id: number): Promise<Media | null> {
    const media = await this.mediaRepository.findOneBy({ id });
    if (!media) return null;
    await this.runOcr(media);
    return this.mediaRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    const media = await this.mediaRepository.findOneBy({ id });
    if (media) {
      try {
        await unlink(join(process.cwd(), 'uploads', media.filename));
      } catch {
        // File may already be gone
      }
      await this.mediaRepository.delete(id);
    }
  }

  async reindexAll(): Promise<{ indexed: number; skipped: number }> {
    const all = await this.mediaRepository.find();
    let indexed = 0;
    let skipped = 0;

    for (const media of all) {
      const shouldIndex = (
        media.mimetype.startsWith('image/') ||
        media.mimetype === 'application/pdf' ||
        media.mimetype.includes('word') ||
        media.mimetype.startsWith('text/')
      );
      if (!shouldIndex) { skipped++; continue; }
      await this.runOcr(media);
      indexed++;
    }

    return { indexed, skipped };
  }
}
