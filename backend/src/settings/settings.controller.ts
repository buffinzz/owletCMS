import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user.entity';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly usersService: UsersService,
  ) {}

  // Public — frontend uses this to display library info
  @Get('public')
  getPublic() {
    return this.settingsService.getPublicSettings();
  }

  // Check if setup is complete — used by frontend guard
  @Get('setup-status')
  async getSetupStatus() {
    const complete = await this.settingsService.isSetupComplete();
    return { isSetupComplete: complete };
  }

  // One-time setup endpoint
  @Post('setup')
  async setup(@Body() body: {
    settings: Record<string, string>;
    adminUsername: string;
    adminPassword: string;
  }) {
    // Block if already set up
    const already = await this.settingsService.isSetupComplete();
    if (already) {
      return { error: 'Setup already complete.' };
    }
    await this.usersService.create(
        body.adminUsername,
        body.adminPassword,
        UserRole.ADMIN,
    );
    await this.settingsService.completeSetup(body.settings);
    
    return { success: true };
  }

  // Protected — admin can update settings after setup
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Body() body: Record<string, string>) {
    for (const [key, value] of Object.entries(body)) {
      await this.settingsService.set(key, value);
    }
    return { success: true };
  }
}