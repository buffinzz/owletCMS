import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalResourcesService } from './digital-resources.service';
import { DigitalResourcesController } from './digital-resources.controller';
import { DigitalResource } from './digital-resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalResource])],
  providers: [DigitalResourcesService],
  controllers: [DigitalResourcesController],
  exports: [DigitalResourcesService],
})
export class DigitalResourcesModule {}
