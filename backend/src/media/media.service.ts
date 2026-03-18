import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './media.entity';

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

  async remove(id: number): Promise<void> {
    await this.mediaRepository.delete(id);
  }
}
