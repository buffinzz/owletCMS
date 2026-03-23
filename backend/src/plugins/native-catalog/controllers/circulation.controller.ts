import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CirculationService } from '../services/circulation.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

@Controller('circulation')
export class CirculationController {
  constructor(private readonly service: CirculationService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll() {
    return this.service.findAll();
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findOverdue() {
    return this.service.findOverdue();
  }

  @Get('patron/:patronId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findByPatron(@Param('patronId') patronId: string) {
    return this.service.findActiveByPatron(+patronId);
  }

  @Get('my-checkouts')
  @UseGuards(JwtAuthGuard)
  myCheckouts(@Request() req: { user: { id: number } }) {
    return this.service.findActiveByPatron(req.user.id);
  }

  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  myHistory(@Request() req: { user: { id: number } }) {
    return this.service.findHistoryByPatron(req.user.id);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  checkout(
    @Body() body: { copyId: number; patronId: number; patronEmail: string; patronName: string },
    @Request() req: { user: { id: number } },
  ) {
    return this.service.checkout(
      body.copyId,
      body.patronId,
      req.user.id,
      { email: body.patronEmail, username: body.patronName },
    );
  }

  @Post('return/:copyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  return(
    @Param('copyId') copyId: string,
    @Request() req: { user: { id: number } },
  ) {
    return this.service.return(+copyId, req.user.id);
  }

  @Post('renew/:circulationId')
  @UseGuards(JwtAuthGuard)
  renew(@Param('circulationId') id: string) {
    return this.service.renew(+id);
  }
}