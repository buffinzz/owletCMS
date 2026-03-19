import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { CollectionItem } from './collection-item.entity';
import { Collection } from './collection.entity';
import { SyncLog } from './sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollectionItem, Collection, SyncLog])],
  providers: [CatalogService, CollectionsService],
  controllers: [CatalogController, CollectionsController],
  exports: [CatalogService, CollectionsService],
})
export class CatalogModule {}