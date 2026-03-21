import { DynamicModule, Module, Logger } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
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
    const pluginModules: any[] = [];
    const allManifests: any[] = [];

    const pluginPaths = PluginRegistry.discoverPluginPaths();

    // Load plugin classes synchronously first
    for (const pluginPath of pluginPaths) {
      const manifest = PluginRegistry.readManifest(pluginPath);
      if (!manifest) continue;
      allManifests.push({ manifest, pluginPath });

      try {
        const indexPath = join(pluginPath, 'index.js');
        if (!existsSync(indexPath)) continue;
        const pluginModule = require(indexPath);
        const PluginClass = pluginModule.default || pluginModule[Object.keys(pluginModule)[0]];
        if (!PluginClass) continue;
        const plugin: OwletPlugin = new PluginClass();
        plugins.push(plugin);
        pluginModules.push(plugin.getModule());
        this.logger.log(`✓ Discovered: ${manifest.displayName}`);
      } catch (err) {
        this.logger.error(`Failed to load plugin ${manifest.name}: ${err.message}`);
      }
    }

    return {
      module: PluginModule,
      imports: [
        SettingsModule,
        ...pluginModules, // ← modules registered statically so routes get mapped
      ],
      providers: [
        PluginRegistry,
        { provide: 'LOADED_PLUGINS', useValue: plugins },
        { provide: 'ALL_PLUGIN_MANIFESTS', useValue: allManifests },
        {
          // Enable/disable check happens here — disabled plugins still have routes
          // but we hide them in the frontend via plugin tabs
          provide: 'PLUGIN_LOADER',
          useFactory: async (dataSource: any) => {
            for (const { manifest } of allManifests) {
              await initPluginSettings(dataSource, manifest.name);
            }
            return plugins;
          },
          inject: [getDataSourceToken()],
        },
      ],
      controllers: [PluginController],
      exports: [PluginRegistry, 'LOADED_PLUGINS', 'ALL_PLUGIN_MANIFESTS'],
      global: true,
    };
  }
}
