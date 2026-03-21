import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PluginModule } from './plugins/plugin.module';
import { PagesModule } from './pages/pages.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';
import { Page } from './pages/page.entity';
import { Event } from './events/event.entity';
import { User } from './users/user.entity';
import { Media } from './media/media.entity';
import { Setting } from './settings/setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USER || 'owlet',
      password: process.env.DB_PASS || 'owlet',
      database: process.env.DB_NAME || 'owlet_dev',
      entities: [Page, Event, User, Media, Setting],
      synchronize: true,
      autoLoadEntities: true, // ← plugins register their entities dynamically
    }),
    // Core modules
    PagesModule,
    EventsModule,
    AuthModule,
    UsersModule,
    MediaModule,
    SettingsModule,
    // Plugin system — discovers and loads all plugins
    PluginModule.forRootAsync(),
  ],
})
export class AppModule {}
