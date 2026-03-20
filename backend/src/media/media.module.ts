import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { OcrService } from './ocr.service';
import { Media } from './media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  providers: [MediaService, OcrService],
  controllers: [MediaController],
})
export class MediaModule {}