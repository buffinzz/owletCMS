import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PagesService } from './pages.service';
import { Page } from './page.entity';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(): Promise<Page[]> {
    return this.pagesService.findAll();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string): Promise<Page | null> {
    return this.pagesService.findOne(slug);
  }

  @Post()
  create(@Body() page: Partial<Page>): Promise<Page> {
    return this.pagesService.create(page);
  }
}
