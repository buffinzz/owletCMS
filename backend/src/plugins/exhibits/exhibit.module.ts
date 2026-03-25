import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exhibit } from './exhibit.entity';
import { ExhibitPanel } from './exhibit-panel.entity';
import { ExhibitsService } from './exhibits.service';
import { ExhibitsController } from './exhibits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Exhibit, ExhibitPanel])],
  providers: [ExhibitsService],
  controllers: [ExhibitsController],
  exports: [ExhibitsService],
})
export class ExhibitModule {}