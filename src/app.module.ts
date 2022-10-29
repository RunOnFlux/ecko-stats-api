import { HttpModule } from '@nestjs/axios';
import { Module, CacheModule, CacheInterceptor } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsoleModule } from 'nestjs-console';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DailyVolumeModule } from './modules/daily-volume/daily-volume.module';
import { DailyTvlModule } from './modules/daily-tvl/daily-tvl.module';
import { TokenCandlesModule } from './modules/token-candles/token-candles.module';
import { KucoinModule } from './modules/kucoin/kucoin.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DexDataModule } from './modules/dex-data/dex-data.module';
import { ChainDataModule } from './modules/chain-data/chain-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.register({ ttl: 60 * 10 }),
    ScheduleModule.forRoot(),
    ConsoleModule,
    MongooseModule.forRoot(process.env.MONGO_DB_URI),
    HttpModule,
    DailyVolumeModule,
    DailyTvlModule,
    TokenCandlesModule,
    KucoinModule,
    AnalyticsModule,
    DexDataModule,
    ChainDataModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
