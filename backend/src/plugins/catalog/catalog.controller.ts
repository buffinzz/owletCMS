import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { CollectionItem } from './collection-item.entity';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Specific routes FIRST ──
  @Get('new-arrivals')
  getNewArrivals(@Query('count') count?: string) {
    return this.catalogService.findNewArrivals(count ? +count : 10);
  }

  @Get('search')
  search(@Query('q') query: string, @Query('count') count?: string) {
    return this.catalogService.search(query, count ? +count : 10);
  }

  @Get('sync-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  getSyncHistory() {
    return this.catalogService.getSyncHistory();
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  sync(@Query('count') count?: string) {
    return this.catalogService.syncNewArrivals(count ? +count : 20);
  }

  @Patch('bulk-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  bulkVisibility(@Body() body: { ids: number[]; isVisible: boolean }) {
    return this.catalogService.bulkToggleVisibility(body.ids, body.isVisible);
  }

  @Delete('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  bulkDelete(@Body() body: { ids: number[] }) {
    return this.catalogService.bulkDelete(body.ids);
  }

  // ── Generic routes ──
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('format') format?: string,
    @Query('visible') visible?: string,
  ) {
    return this.catalogService.findAll({ search, source, format, visible });
  }

  // ── Parameterised routes LAST ──
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(+id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  create(@Body() data: Partial<CollectionItem>) {
    return this.catalogService.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<CollectionItem>) {
    return this.catalogService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.catalogService.remove(+id);
  }
}
