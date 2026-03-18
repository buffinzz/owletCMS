import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PagesModule } from './pages/pages.module';
import { EventsModule } from './events/events.module';
import { User } from './users/user.entity';
import { Page } from './pages/page.entity';
import { Event } from './events/event.entity';
import { MediaModule } from './media/media.module';
import { Media } from './media/media.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'owlet',
      password: 'owlet',
      database: 'owlet_dev',
      entities: [Page, Event, User, Media],
      synchronize: true,
    }),
    PagesModule,
    EventsModule,
    UsersModule,
    AuthModule,
    UsersModule,
    MediaModule,
  ],
})
export class AppModule {}
