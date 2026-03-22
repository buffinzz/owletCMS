import { OwletPlugin, PluginManifest } from '../plugin.interface';
import { CatalogModule } from './catalog.module';
import { CollectionItem } from './collection-item.entity';
import { SyncLog } from './sync-log.entity';
import manifest from './owlet-plugin.json';

export default class CatalogPlugin implements OwletPlugin {
  manifest = manifest as PluginManifest;

  getModule() {
    return CatalogModule;
  }

  getEntities() {
    return [CollectionItem, SyncLog];
  }
}