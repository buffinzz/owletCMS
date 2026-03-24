import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { PatronProfile } from './patron-profile.entity';
import { PatronService } from './patron.service';
import { PatronController } from './patron.controller';
import { SettingsModule } from '../../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PatronProfile]),
    SettingsModule,
],
  providers: [PatronService],
  controllers: [PatronController],
  exports: [PatronService],
})
export class PatronModule {}
