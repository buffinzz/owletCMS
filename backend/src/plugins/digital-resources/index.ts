import { OwletPlugin, PluginManifest } from '../plugin.interface';
import { DigitalResourcesModule } from './digital-resources.module';
import { DigitalResource } from './digital-resource.entity';
import manifest from './owlet-plugin.json';

export default class DigitalResourcesPlugin implements OwletPlugin {
  manifest = manifest as PluginManifest;

  getModule() {
    return DigitalResourcesModule;
  }

  getEntities() {
    return [DigitalResource];
  }
}