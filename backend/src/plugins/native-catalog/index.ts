import { OwletPlugin, PluginManifest } from '../plugin.interface';
import { NativeCatalogModule } from './native-catalog.module';
import { NativeCopy } from './entities/native-copy.entity';
import { CirculationRecord } from './entities/circulation-record.entity';
import { Hold } from './entities/hold.entity';
import { EmailLog } from './entities/email-log.entity';
import manifest from './owlet-plugin.json';

export default class NativeCatalogPlugin implements OwletPlugin {
  manifest = manifest as PluginManifest;

  getModule() {
    return NativeCatalogModule;
  }

  getEntities() {
    return [NativeCopy, CirculationRecord, Hold, EmailLog];
  }
}