import { Injectable } from '@nestjs/common';
import { Page } from './page.entity';

@Injectable()
export class PagesService {
  private pages: Page[] = [];

  findAll(): Page[] {
    return this.pages;
  }

  findOne(slug: string): Page | undefined {
    return this.pages.find(page => page.slug === slug);
  }

  create(page: Page): Page {
    page.id = Date.now();
    page.createdAt = new Date();
    page.updatedAt = new Date();

    this.pages.push(page);
    return page;
  }
}
