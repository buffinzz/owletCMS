import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request, ParseIntPipe
} from '@nestjs/common';
import { PatronService } from './patron.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('patrons')
export class PatronController {
  constructor(private readonly patronService: PatronService) {}

  // ── Public ──
  @Get('registration-settings')
  async getRegistrationSettings() {
    return this.patronService.getRegistrationSettingsFromDb();
  }

  @Post('register')
  register(@Body() body: {
    username: string;
    password: string;
    email: string;
    displayName?: string;
    preferredName?: string;
  }) {
    return this.patronService.register(body);
  }

  // ── Patron self-service ──
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { id: number } }) {
    return this.patronService.getPortalData(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(
    @Request() req: { user: { id: number } },
    @Body() body: {
      displayName?: string;
      preferredName?: string;
      notifyByEmail?: boolean;
      readingInterests?: string[];
    },
  ) {
    return this.patronService.updateProfile(req.user.id, body);
  }

  // ── Staff / Admin ──
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findAll(@Query('search') search?: string) {
    if (search) return this.patronService.search(search);
    return this.patronService.findAll();
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findPending() {
    return this.patronService.findPendingApproval();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patronService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  create(@Body() body: any) {
    return this.patronService.createPatron(body);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.patronService.approve(id);
  }

  @Patch(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
  ) {
    return this.patronService.resetPassword(id, body.password);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.patronService.update(id, body);
  }
}
