import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './media.entity';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async save(file: Express.Multer.File, uploadedBy: number): Promise<Media> {
    const media = this.mediaRepository.create({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy,
    });
    return this.mediaRepository.save(media);
  }

  async findAll(): Promise<Media[]> {
    return this.mediaRepository.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: number, data: { alt?: string; caption?: string }): Promise<Media | null> {
    await this.mediaRepository.update(id, data);
    return this.mediaRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    const media = await this.mediaRepository.findOneBy({ id });
    if (media) {
      // Delete the actual file from disk
      try {
        await unlink(join(process.cwd(), 'uploads', media.filename));
      } catch {
        // File may already be gone, continue
      }
      await this.mediaRepository.delete(id);
    }
  }
}