import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exhibit } from './exhibit.entity';
import { ExhibitPanel } from './exhibit-panel.entity';

@Injectable()
export class ExhibitsService {
  constructor(
    @InjectRepository(Exhibit)
    private exhibitRepository: Repository<Exhibit>,
    @InjectRepository(ExhibitPanel)
    private panelRepository: Repository<ExhibitPanel>,
  ) {}

  // ── Exhibits ──
  async findAll(): Promise<Exhibit[]> {
    return this.exhibitRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findPublished(): Promise<Exhibit[]> {
    return this.exhibitRepository.find({
      where: { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findFeatured(): Promise<Exhibit[]> {
    return this.exhibitRepository.find({
      where: { isPublished: true, isFeatured: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Exhibit | null> {
    return this.exhibitRepository.findOneBy({ id });
  }

  async findBySlug(slug: string): Promise<Exhibit | null> {
    return this.exhibitRepository.findOneBy({ slug });
  }

  async findBySlugWithPanels(slug: string): Promise<(Exhibit & { panels: ExhibitPanel[] }) | null> {
    const exhibit = await this.exhibitRepository.findOneBy({ slug, isPublished: true });
    if (!exhibit) return null;
    const panels = await this.panelRepository.find({
      where: { exhibitId: exhibit.id },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return { ...exhibit, panels };
  }

  async findOneWithPanels(id: number): Promise<(Exhibit & { panels: ExhibitPanel[] }) | null> {
    const exhibit = await this.exhibitRepository.findOneBy({ id });
    if (!exhibit) return null;
    const panels = await this.panelRepository.find({
      where: { exhibitId: id },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return { ...exhibit, panels };
  }

  async create(data: Partial<Exhibit>): Promise<Exhibit> {
    const count = await this.exhibitRepository.count();
    const exhibit = this.exhibitRepository.create({
      ...data,
      sortOrder: data.sortOrder ?? count,
    });
    return this.exhibitRepository.save(exhibit);
  }

  async update(id: number, data: Partial<Exhibit>): Promise<Exhibit | null> {
    await this.exhibitRepository.update(id, data);
    return this.exhibitRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.panelRepository.delete({ exhibitId: id });
    await this.exhibitRepository.delete(id);
  }

  // ── Panels ──
  async findPanels(exhibitId: number): Promise<ExhibitPanel[]> {
    return this.panelRepository.find({
      where: { exhibitId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async createPanel(data: Partial<ExhibitPanel>): Promise<ExhibitPanel> {
    const count = await this.panelRepository.count({ where: { exhibitId: data.exhibitId } });
    const panel = this.panelRepository.create({
      ...data,
      sortOrder: data.sortOrder ?? count,
    });
    return this.panelRepository.save(panel);
  }

  async updatePanel(id: number, data: Partial<ExhibitPanel>): Promise<ExhibitPanel | null> {
    await this.panelRepository.update(id, data);
    return this.panelRepository.findOneBy({ id });
  }

  async removePanel(id: number): Promise<void> {
    await this.panelRepository.delete(id);
  }

  async reorderPanels(panels: Array<{ id: number; sortOrder: number }>): Promise<void> {
    for (const { id, sortOrder } of panels) {
      await this.panelRepository.update(id, { sortOrder });
    }
  }
}