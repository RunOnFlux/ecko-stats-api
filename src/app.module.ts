import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsoleModule } from 'nestjs-console';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyVolumeModule } from './modules/daily-volume/daily-volume.module';
import { DailyTvlModule } from './modules/daily-tvl/daily-tvl.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ConsoleModule,
    MongooseModule.forRoot(process.env.MONGO_DB_URI),
    HttpModule,
    DailyVolumeModule,
    DailyTvlModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
