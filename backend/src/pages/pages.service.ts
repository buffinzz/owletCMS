import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './page.entity';

@Injectable()
export class PagesService {

  constructor(
    @InjectRepository(Page)
    private pagesRepository: Repository<Page>,
  ) {}

  findAll(): Promise<Page[]> {
    return this.pagesRepository.find();
  }

  findOne(slug: string): Promise<Page | null> {
    return this.pagesRepository.findOneBy({ slug });
  }

  create(page: Partial<Page>): Promise<Page> {
    const newPage = this.pagesRepository.create(page);
    return this.pagesRepository.save(newPage);
  }
  async update(id: number, data: Partial<Page>): Promise<Page | null> {
    await this.pagesRepository.update(id, data);
    return this.pagesRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.pagesRepository.delete(id);
  }
}
