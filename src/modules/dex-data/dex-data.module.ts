import { Module } from '@nestjs/common';
import { CoingeckoModule } from '../coingecko/coingecko.module';
import { DailyVolumeModule } from '../daily-volume/daily-volume.module';
import { DexDataController } from './dex-data.controller';
import { DexDataService } from './dex-data.service';

@Module({
  imports: [DailyVolumeModule, CoingeckoModule],
  controllers: [DexDataController],
  providers: [DexDataService],
  exports: [DexDataService],
})
export class DexDataModule {}
