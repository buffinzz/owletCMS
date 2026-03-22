import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CollectionsService } from './collections.service';
import { CollectionItem } from './collection-item.entity';
import { SyncLog } from './sync-log.entity';
import { CollectionsModule } from '../../collections/collections.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionItem, SyncLog]),
    CollectionsModule,
  ],
  providers: [CatalogService, CollectionsService],
  controllers: [CatalogController],
  exports: [CatalogService, CollectionsService],
})
export class CatalogModule {}
