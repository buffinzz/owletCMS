import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { NativeCatalogService } from '../services/native-catalog.service';
import { NativeCopy } from '../entities/native-copy.entity';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@Controller('catalog')
export class NativeCatalogController {
  constructor(private readonly service: NativeCatalogService) {}

  @Get('isbn/:isbn')
  @UseGuards(JwtAuthGuard)
  lookupIsbn(@Param('isbn') isbn: string) {
    return this.service.lookupIsbn(isbn);
  }

  @Get('copies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'staff')
  findAllCopies() {
    return this.service.findAllCopies();
  }

  @Get('copies/item/:itemId')
  @UseGuards(JwtAuthGuard)
  findCopiesByItem(@Param('itemId') itemId: string) {
    return this.service.findCopiesByItem(+itemId);
  }

  @Get('copies/barcode/:barcode')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findByBarcode(@Param('barcode') barcode: string) {
    return this.service.findCopyByBarcode(barcode);
  }

  @Get(':id/availability')
  async getAvailability(@Param('id') id: string) {
    const copies = await this.service.findCopiesByItem(+id);
    const available = copies.filter(c => c.status === 'available').length;
    const checkedOut = copies.filter(c => c.status === 'checked_out').length;
    const onHold = copies.filter(c => c.status === 'on_hold').length;
    return {
      total: copies.length,
      available,
      checkedOut,
      onHold,
      hasNativeCopies: copies.length > 0,
    };
  }

  @Post('copies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'staff')
  createCopy(@Body() data: Partial<NativeCopy>) {
    return this.service.createCopy(data);
  }

  @Patch('copies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'staff')
  updateCopy(@Param('id') id: string, @Body() data: Partial<NativeCopy>) {
    return this.service.updateCopy(+id, data);
  }

  @Delete('copies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  removeCopy(@Param('id') id: string) {
    return this.service.removeCopy(+id);
  }
}