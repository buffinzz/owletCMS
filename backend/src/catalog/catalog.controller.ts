import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CollectionItem } from './collection-item.entity';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── These MUST come before :id route ──
  @Get('new-arrivals')
  getNewArrivals(@Query('count') count?: string) {
    return this.catalogService.findNewArrivals(count ? +count : 10);
  }

  @Get('search')
  search(@Query('q') query: string, @Query('count') count?: string) {
    return this.catalogService.search(query, count ? +count : 10);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  sync(@Query('count') count?: string) {
    return this.catalogService.syncNewArrivals(count ? +count : 20);
  }

  // ── Generic routes AFTER specific ones ──
  @Get()
  findAll() {
    return this.catalogService.findAll();
  }

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
