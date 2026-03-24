import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { HoldsService } from '../services/holds.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@Controller('holds')
export class HoldsController {
  constructor(private readonly service: HoldsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll() {
    return this.service.findAll();
  }

  @Get('ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findReady() {
    return this.service.findReady();
  }

  @Get('my-holds')
  @UseGuards(JwtAuthGuard)
  myHolds(@Request() req: { user: { id: number } }) {
    return this.service.findByPatron(req.user.id);
  }

  @Get('item/:itemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findByItem(@Param('itemId') itemId: string) {
    return this.service.findByItem(+itemId);
  }

  @Post('item/:itemId')
  @UseGuards(JwtAuthGuard)
  placeHold(
    @Param('itemId') itemId: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.service.placeHold(+itemId, req.user.id);
  }

  @Delete(':holdId')
  @UseGuards(JwtAuthGuard)
  cancelHold(
    @Param('holdId') holdId: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.service.cancelHold(+holdId, req.user.id);
  }

  @Post(':holdId/fulfill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  fulfillHold(@Param('holdId') holdId: string) {
    return this.service.fulfillHold(+holdId);
  }
}