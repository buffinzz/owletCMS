import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NavigationService } from './navigation.service';
import { NavItem, NavArea } from './nav-item.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('navigation')
export class NavigationController {
  constructor(private readonly navigationService: NavigationService) {}

  // Public — used by frontend to render nav
  @Get('public')
  getPublic(@Query('area') area?: NavArea) {
    return this.navigationService.findPublicTree(area || NavArea.HEADER);
  }

  // Protected — admin nav editor
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  getAll(@Query('area') area?: NavArea) {
    return this.navigationService.findTree(area || NavArea.HEADER);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  create(@Body() data: Partial<NavItem>) {
    return this.navigationService.create(data);
  }

  @Patch('reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  reorder(@Body() body: Array<{ id: number; sortOrder: number; parentId: number | null }>) {
    return this.navigationService.reorder(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<NavItem>) {
    return this.navigationService.update(+id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.navigationService.remove(+id);
  }
}
