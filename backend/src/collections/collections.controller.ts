import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { Collection } from './collection.entity';
import { MemberEntityType } from './collection-membership.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // ── Specific routes first ──
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

  @Get('by-entity/:type/:entityId')
  @UseGuards(JwtAuthGuard)
  getByEntity(
    @Param('type') type: MemberEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.collectionsService.getCollectionsByEntity(type, +entityId);
  }

  // ── Public ──
  @Get()
  findVisible() {
    return this.collectionsService.findVisible();
  }

  // ── Parameterised routes last ──
  @Get('id/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  async findOne(@Param('id') id: string) {
    const collection = await this.collectionsService.findOne(+id);
    if (!collection) return null;
    const memberships = await this.collectionsService.getMemberships(+id);
    return { ...collection, memberships };
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

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  addMember(
    @Param('id') id: string,
    @Body() body: { entityType: MemberEntityType; entityId: number },
  ) {
    return this.collectionsService.addMember(+id, body.entityType, body.entityId);
  }

  @Delete(':id/members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor')
  removeMember(
    @Param('id') id: string,
    @Body() body: { entityType: MemberEntityType; entityId: number },
  ) {
    return this.collectionsService.removeMember(+id, body.entityType, body.entityId);
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

  // Public — returns memberships for a collection (no auth required)
  @Get(':slug/memberships')
  async getMembershipsBySlug(@Param('slug') slug: string) {
    const collection = await this.collectionsService.findBySlug(slug);
    if (!collection) return [];
    return this.collectionsService.getMemberships(collection.id);
  }
}
