import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { OwletPlugin, PluginManifest, PluginTab } from './plugin.interface';

@Injectable()
export class PluginRegistry implements OnModuleInit {
  private readonly logger = new Logger(PluginRegistry.name);
  private plugins: Map<string, OwletPlugin> = new Map();

  constructor(
    @Inject('LOADED_PLUGINS')
    private loadedPlugins: OwletPlugin[],
  ) {}

  onModuleInit() {
    for (const plugin of this.loadedPlugins) {
      this.plugins.set(plugin.manifest.name, plugin);
    }
    this.logger.log(`${this.plugins.size} plugin(s) loaded`);
    for (const [, plugin] of this.plugins) {
      this.logger.log(`  ✓ ${plugin.manifest.displayName} v${plugin.manifest.version}`);
    }
  }

  register(plugin: OwletPlugin): void {
    this.plugins.set(plugin.manifest.name, plugin);
  }

  getAll(): OwletPlugin[] {
    return Array.from(this.plugins.values());
  }

  get(name: string): OwletPlugin | undefined {
    return this.plugins.get(name);
  }

  getManifests(): PluginManifest[] {
    return this.getAll().map(p => p.manifest);
  }

  getAdminTabs(userRole: string): Array<PluginTab & { pluginName: string }> {
    const tabs: Array<PluginTab & { pluginName: string }> = [];
    for (const plugin of this.getAll()) {
      for (const tab of plugin.manifest.adminTabs || []) {
        if (tab.roles.includes(userRole)) {
          tabs.push({ ...tab, pluginName: plugin.manifest.name });
        }
      }
    }
    return tabs;
  }

  static discoverPluginPaths(): string[] {
    const paths: string[] = [];

    // Check dist first (production), then src (development)
    const possibleDirs = [
      join(process.cwd(), 'dist', 'plugins'),
      join(process.cwd(), 'src', 'plugins'),
    ];

    for (const builtinDir of possibleDirs) {
      if (!existsSync(builtinDir)) continue;

      const { readdirSync } = require('fs');
      const dirs = readdirSync(builtinDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        const manifestPath = join(builtinDir, dir.name, 'owlet-plugin.json');
        if (existsSync(manifestPath)) {
          paths.push(join(builtinDir, dir.name));
        }
      }

      // Only use first directory that exists
      if (paths.length > 0) break;
    }

    // Community plugins from node_modules/owlet-plugin-*
    const nodeModulesDir = join(process.cwd(), 'node_modules');
    if (existsSync(nodeModulesDir)) {
      const { readdirSync } = require('fs');
      try {
        const modules = readdirSync(nodeModulesDir, { withFileTypes: true });
        for (const mod of modules) {
          if (!mod.isDirectory()) continue;
          if (!mod.name.startsWith('owlet-plugin-')) continue;
          const manifestPath = join(nodeModulesDir, mod.name, 'owlet-plugin.json');
          if (existsSync(manifestPath)) {
            paths.push(join(nodeModulesDir, mod.name));
          }
        }
      } catch { }
    }

    return paths;
  }

  static readManifest(pluginPath: string): PluginManifest | null {
    try {
      const manifestPath = join(pluginPath, 'owlet-plugin.json');
      const raw = readFileSync(manifestPath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

export async function isPluginEnabled(
  dataSource: DataSource,
  pluginName: string,
): Promise<boolean> {
  try {
    const result = await dataSource.query(
      `SELECT value FROM setting WHERE key = $1`,
      [`plugin_enabled_${pluginName}`]
    );
    if (!result || result.length === 0) return true;
    return result[0].value !== 'false';
  } catch {
    return true;
  }
}

export async function initPluginSettings(
  dataSource: DataSource,
  pluginName: string,
): Promise<void> {
  try {
    await dataSource.query(
      `INSERT INTO setting (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [`plugin_enabled_${pluginName}`, 'true']
    );
  } catch { }
}
