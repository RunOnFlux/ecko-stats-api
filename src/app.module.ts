import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DailyVolumeModule } from './modules/daily-volume/daily-volume.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_DB_URI),
    HttpModule,
    DailyVolumeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
