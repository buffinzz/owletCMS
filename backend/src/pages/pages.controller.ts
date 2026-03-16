import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { PagesService } from './pages.service';
import { Page } from './page.entity';

@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  findAll(): Page[] {
    return this.pagesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Page {
    const page = this.pagesService.findOne(slug);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  @Post()
  create(@Body() page: Page): Page {
    return this.pagesService.create(page);
  }
}
