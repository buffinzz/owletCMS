import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesModule } from './pages/pages.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';
import { CatalogModule } from './catalog/catalog.module';
import { Page } from './pages/page.entity';
import { Event } from './events/event.entity';
import { User } from './users/user.entity';
import { Media } from './media/media.entity';
import { Setting } from './settings/setting.entity';
import { CollectionItem } from './catalog/collection-item.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'owlet',
      password: 'owlet',
      database: 'owlet_dev',
      entities: [Page, Event, User, Media, Setting, CollectionItem],
      synchronize: true,
    }),
    PagesModule,
    EventsModule,
    AuthModule,
    UsersModule,
    MediaModule,
    SettingsModule,
    CatalogModule,
  ],
})
export class AppModule {}