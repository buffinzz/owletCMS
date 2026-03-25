import {
  Controller, Post, Get, Delete, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFile,
  Request, Res, Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: {
    title?: string;
    alt?: string;
    description?: string;
    tags?: string[];
    url?: string;
  }) {
    return this.mediaService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('search') search?: string) {
    return this.mediaService.findAll(search);
  }

  @Post(':id/reindex')
  @UseGuards(JwtAuthGuard)
  reindex(@Param('id') id: string) {
    return this.mediaService.reindex(+id);
  }

  @Post('reindex-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reindexAll() {
    return this.mediaService.reindexAll();
  }
  @Post('external')
  @UseGuards(JwtAuthGuard)
  async addExternal(
    @Body() body: {
      url: string;
      title?: string;
      alt?: string;
      description?: string;
      mimetype?: string;
      tags?: string[];
    },
    @Request() req: { user: { id: number } },
  ) {
    return this.mediaService.saveExternal(body, req.user.id);
  }
}
