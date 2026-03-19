import {
  Controller, Post, Get, Delete, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFile,
  Request, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import { v4 as uuid } from 'uuid';

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
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id: number } }
  ) {
    const media = await this.mediaService.save(file, req.user.id);
    return {
      url: `http://localhost:3000/media/file/${media.filename}`,
      filename: media.filename,
      id: media.id,
      originalName: media.originalName,
      mimetype: media.mimetype,
      size: media.size,
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: { alt?: string; caption?: string }) {
    return this.mediaService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }
}