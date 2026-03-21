import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PluginRegistry } from './plugin.registry';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SettingsService } from '../settings/settings.service';
import { Inject } from '@nestjs/common';

@Controller('plugins')
export class PluginController {
  constructor(
    private readonly registry: PluginRegistry,
    private readonly settingsService: SettingsService,
    @Inject('ALL_PLUGIN_MANIFESTS')
    private readonly allManifests: Array<{ manifest: any; pluginPath: string }>,
  ) {}

  @Get()
  getPlugins() {
    return this.registry.getManifests();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllPlugins() {
    return Promise.all(
      this.allManifests.map(async ({ manifest }) => {
        const enabled = await this.settingsService.get(`plugin_enabled_${manifest.name}`);
        return {
          ...manifest,
          enabled: enabled !== 'false',
          loaded: !!this.registry.get(manifest.name),
        };
      })
    );
  }

  @Post('toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async togglePlugin(@Body() body: { name: string; enabled: boolean }) {
    await this.settingsService.set(
      `plugin_enabled_${body.name}`,
      body.enabled ? 'true' : 'false'
    );
    return {
      success: true,
      message: `Plugin ${body.name} ${body.enabled ? 'enabled' : 'disabled'}. Restart required.`,
      requiresRestart: true,
    };
  }

  @Get('tabs')
  @UseGuards(JwtAuthGuard)
  getAdminTabs(@Request() req: { user: { role: string } }) {
    return this.registry.getAdminTabs(req.user.role);
  }

  @Get('debug')
  debug() {
    const { join } = require('path');
    const { existsSync, readdirSync } = require('fs');
    const cwd = process.cwd();
    const builtinDir = join(cwd, 'src', 'plugins');
    const distDir = join(cwd, 'dist', 'plugins');
    return {
      cwd,
      builtinDir,
      builtinExists: existsSync(builtinDir),
      distExists: existsSync(distDir),
      builtinContents: existsSync(builtinDir) ? readdirSync(builtinDir) : [],
      distContents: existsSync(distDir) ? readdirSync(distDir) : [],
    };
  }
}