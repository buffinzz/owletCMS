import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { Collection } from './collection.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // ── Specific routes FIRST ──
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findAll() {
    return this.collectionsService.findAll();
  }

  @Patch('bulk-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  bulkVisibility(@Body() body: { ids: number[]; isVisible: boolean }) {
    return this.collectionsService.bulkToggleVisibility(body.ids, body.isVisible);
  }

  // ── Public ──
  @Get()
  findVisible() {
    return this.collectionsService.findVisible();
  }

  // ── Parameterised routes LAST ──
  @Get('id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(+id);
  }

  @Get('by-item/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findByItem(@Param('itemId') itemId: string) {
    return this.collectionsService.findByItem(+itemId);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  create(@Body() data: Partial<Collection>) {
    return this.collectionsService.create(data);
  }

  @Post(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  addItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.collectionsService.addItem(+id, +itemId);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.collectionsService.removeItem(+id, +itemId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<Collection>) {
    return this.collectionsService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(+id);
  }
}
