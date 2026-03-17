import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesModule } from './pages/pages.module';
import { EventsModule } from './events/events.module';
import { Page } from './pages/page.entity';
import { Event } from './events/event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'owlet',
      password: 'owlet',
      database: 'owlet_dev',
      entities: [Page, Event],
      synchronize: true,
    }),
    PagesModule,
    EventsModule,
  ],
})
export class AppModule {}