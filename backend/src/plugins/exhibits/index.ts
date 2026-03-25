import { OwletPlugin, PluginManifest } from '../plugin.interface';
import { ExhibitModule } from './exhibit.module';
import { Exhibit } from './exhibit.entity';
import { ExhibitPanel } from './exhibit-panel.entity';
import manifest from './owlet-plugin.json';

export default class ExhibitsPlugin implements OwletPlugin {
  manifest = manifest as PluginManifest;

  getModule() {
    return ExhibitModule;
  }

  getEntities() {
    return [Exhibit, ExhibitPanel];
  }
}
