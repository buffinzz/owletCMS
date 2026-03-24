import { DynamicModule, Module, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PluginRegistry, isPluginEnabled, initPluginSettings } from './plugin.registry';
import { PluginController } from './plugin.controller';
import { OwletPlugin } from './plugin.interface';
import { SettingsModule } from '../settings/settings.module';
import { join } from 'path';
import { existsSync } from 'fs';

@Module({})
export class PluginModule {
  private static readonly logger = new Logger(PluginModule.name);

  static async forRootAsync(): Promise<DynamicModule> {
    const plugins: OwletPlugin[] = [];
    const modules: any[] = [];
    const allManifests: any[] = [];

    const pluginPaths = PluginRegistry.discoverPluginPaths();
    PluginModule.logger.log(`Discovered ${pluginPaths.length} plugin paths:`);
    pluginPaths.forEach(p => PluginModule.logger.log(`  - ${p}`));

    // Create a temporary DB connection to check enabled status
    // before NestJS DI is available
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'owlet',
      password: process.env.DB_PASS || 'owlet',
      database: process.env.DB_NAME || 'owlet_dev',
    });

    let dbAvailable = false;
    try {
      await dataSource.initialize();
      dbAvailable = true;
    } catch {
      PluginModule.logger.warn('Could not connect to DB for plugin check — loading all plugins');
    }

    for (const pluginPath of pluginPaths) {
      const manifest = PluginRegistry.readManifest(pluginPath);
      if (!manifest) continue;

      allManifests.push({ manifest, pluginPath });

      // Check if plugin is enabled in DB
      if (dbAvailable) {
        await initPluginSettings(dataSource, manifest.name);
        const enabled = await isPluginEnabled(dataSource, manifest.name);
        if (!enabled) {
          PluginModule.logger.log(`Plugin ${manifest.displayName} is disabled — skipping`);
          continue;
        }
      }

      try {
        const indexPath = join(pluginPath, 'index.js');
        if (!existsSync(indexPath)) {
          PluginModule.logger.warn(`Plugin ${manifest.name} has no index.js — skipping`);
          continue;
        }

        const pluginModule = require(indexPath);
        const PluginClass = pluginModule.default || pluginModule[Object.keys(pluginModule)[0]];

        if (!PluginClass) {
          PluginModule.logger.warn(`Plugin ${manifest.name} has no default export`);
          continue;
        }

        const plugin: OwletPlugin = new PluginClass();
        plugins.push(plugin);
        modules.push(plugin.getModule());

        PluginModule.logger.log(`✓ Loaded plugin: ${manifest.displayName} v${manifest.version}`);
      } catch (err) {
        PluginModule.logger.error(`Failed to load plugin ${manifest.name}: ${err.message}`);
      }
    }

    // Clean up temporary DB connection
    if (dbAvailable) {
      await dataSource.destroy();
    }

    return {
      module: PluginModule,
      imports: [SettingsModule, ...modules],
      providers: [
        PluginRegistry,
        { provide: 'LOADED_PLUGINS', useValue: plugins },
        { provide: 'ALL_PLUGIN_MANIFESTS', useValue: allManifests },
      ],
      controllers: [PluginController],
      exports: [PluginRegistry, 'LOADED_PLUGINS', 'ALL_PLUGIN_MANIFESTS'],
      global: true,
    };
  }
}
