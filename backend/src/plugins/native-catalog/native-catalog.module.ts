import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NativeCopy } from './entities/native-copy.entity';
import { CirculationRecord } from './entities/circulation-record.entity';
import { Hold } from './entities/hold.entity';
import { EmailLog } from './entities/email-log.entity';
import { NativeCatalogService } from './services/native-catalog.service';
import { CirculationService } from './services/circulation.service';
import { HoldsService } from './services/holds.service';
import { EmailService } from './services/email.service';
import { NativeCatalogController } from './controllers/native-catalog.controller';
import { CirculationController } from './controllers/circulation.controller';
import { HoldsController } from './controllers/holds.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NativeCopy, CirculationRecord, Hold, EmailLog])],
  providers: [NativeCatalogService, CirculationService, HoldsService, EmailService],
  controllers: [NativeCatalogController, CirculationController, HoldsController],
  exports: [NativeCatalogService, CirculationService, HoldsService],
})
export class NativeCatalogModule {}