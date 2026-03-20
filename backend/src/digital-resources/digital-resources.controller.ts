import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DigitalResourcesService } from './digital-resources.service';
import { DigitalResource } from './digital-resource.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('digital-resources')
export class DigitalResourcesController {
  constructor(private readonly service: DigitalResourcesService) {}

  // Public
  @Get()
  findVisible() {
    return this.service.findVisible();
  }

  @Get('by-category/:category')
  findByCategory(@Param('category') category: string) {
    return this.service.findByCategory(category);
  }

  // Admin
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  create(@Body() data: Partial<DigitalResource>) {
    return this.service.create(data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<DigitalResource>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }
}