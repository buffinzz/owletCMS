import { OwletPlugin, PluginManifest } from '../plugin.interface';
import { PatronModule } from './patron.module';
import { PatronProfile } from './patron-profile.entity';
import manifest from './owlet-plugin.json';

export default class PatronsPlugin implements OwletPlugin {
  manifest = manifest as PluginManifest;

  getModule() {
    return PatronModule;
  }

  getEntities() {
    return [PatronProfile]; // User entity already registered in core
  }
}
