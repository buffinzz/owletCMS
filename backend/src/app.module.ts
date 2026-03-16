import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesModule } from './pages/pages.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'owlet',
      password: 'owlet',
      database: 'owlet_dev',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
