import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExhibitsService } from './exhibits.service';
import { Exhibit } from './exhibit.entity';
import { ExhibitPanel } from './exhibit-panel.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('exhibits')
export class ExhibitsController {
  constructor(private readonly service: ExhibitsService) {}

  // ── Public ──
  @Get()
  findPublished() {
    return this.service.findPublished();
  }

  @Get('featured')
  findFeatured() {
    return this.service.findFeatured();
  }

  @Get(':slug/panels')
  findBySlugWithPanels(@Param('slug') slug: string) {
    return this.service.findBySlugWithPanels(slug);
  }

  // ── Admin ──
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findAll() {
    return this.service.findAll();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findOneWithPanels(@Param('id') id: string) {
    return this.service.findOneWithPanels(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  create(@Body() data: Partial<Exhibit>) {
    return this.service.create(data);
  }

  @Patch('panels/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  reorderPanels(@Body() panels: Array<{ id: number; sortOrder: number }>) {
    return this.service.reorderPanels(panels);
  }

  @Post(':id/panels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  createPanel(@Param('id') id: string, @Body() data: Partial<ExhibitPanel>) {
    return this.service.createPanel({ ...data, exhibitId: +id });
  }

  @Patch('panels/:panelId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  updatePanel(@Param('panelId') panelId: string, @Body() data: Partial<ExhibitPanel>) {
    return this.service.updatePanel(+panelId, data);
  }

  @Delete('panels/:panelId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  removePanel(@Param('panelId') panelId: string) {
    return this.service.removePanel(+panelId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<Exhibit>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}