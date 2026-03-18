import {
  Controller, Post, Get, Delete, Param,
  UseGuards, UseInterceptors, UploadedFile,
  Request, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { v4 as uuid } from 'uuid';
import type { Response } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const unique = uuid();
        cb(null, `${unique}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|webp/;
      const valid = allowed.test(file.mimetype);
      cb(null, valid);
    },
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id: number } }
  ) {
    const media = await this.mediaService.save(file, req.user.id);
    return {
      url: `/media/file/${media.filename}`,
      filename: media.filename,
      id: media.id,
    };
  }

  @Get('file/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', filename);
    res.sendFile(filePath);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.mediaService.findAll();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }
}