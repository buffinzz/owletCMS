import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NavItem, NavArea } from './nav-item.entity';

export interface NavTree extends NavItem {
  children: NavTree[];
}

@Injectable()
export class NavigationService {
  constructor(
    @InjectRepository(NavItem)
    private navRepository: Repository<NavItem>,
  ) {}

  async findAll(area: NavArea = NavArea.HEADER): Promise<NavItem[]> {
    return this.navRepository.find({
      where: { area },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findTree(area: NavArea = NavArea.HEADER): Promise<NavTree[]> {
    const items = await this.findAll(area);
    return this.buildTree(items);
  }

  async findPublicTree(area: NavArea = NavArea.HEADER): Promise<NavTree[]> {
    const items = await this.navRepository.find({
      where: { area, isVisible: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return this.buildTree(items);
  }

  private buildTree(items: NavItem[]): NavTree[] {
    const map = new Map<number, NavTree>();
    const roots: NavTree[] = [];

    // First pass — create all nodes
    items.forEach(item => {
      map.set(item.id, { ...item, children: [] });
    });

    // Second pass — build tree
    items.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async create(data: Partial<NavItem>): Promise<NavItem> {
  const siblings = await this.navRepository.find({
    where: data.parentId
      ? { area: data.area || NavArea.HEADER, parentId: data.parentId }
      : { area: data.area || NavArea.HEADER },
  });
  data.sortOrder = siblings.length;
  const item = this.navRepository.create(data);
  return this.navRepository.save(item);
}

  async update(id: number, data: Partial<NavItem>): Promise<NavItem | null> {
    await this.navRepository.update(id, data);
    return this.navRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    // Also remove children
    const children = await this.navRepository.findBy({ parentId: id });
    for (const child of children) {
      await this.remove(child.id);
    }
    await this.navRepository.delete(id);
  }

  async reorder(items: Array<{ id: number; sortOrder: number; parentId: number | null }>): Promise<void> {
    for (const item of items) {
      await this.navRepository.update(item.id, {
        sortOrder: item.sortOrder,
        parentId: item.parentId ?? undefined,
      });
    }
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.navRepository.count();
    if (existing > 0) return;

    const defaults = [
      { label: 'Collections', type: 'url' as any, value: '/collections', sortOrder: 0 },
      { label: 'Events', type: 'events' as any, value: '/events', sortOrder: 1 },
      { label: 'Staff', type: 'staff' as any, value: '/staff', sortOrder: 2 },
      { label: 'Staff login', type: 'url' as any, value: '/admin/login', sortOrder: 3 },
    ];

    for (const item of defaults) {
      await this.navRepository.save(
        this.navRepository.create({ ...item, area: NavArea.HEADER, isVisible: true })
      );
    }
  }
}
