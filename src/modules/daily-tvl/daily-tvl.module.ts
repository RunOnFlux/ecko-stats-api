import { Module } from '@nestjs/common';
import { DailyTvlService } from './daily-tvl.service';
import { DailyTvlController } from './daily-tvl.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyTVL, DailyTVLSchema } from './schemas/daily-tvl.schema';
import { HttpModule } from '@nestjs/axios';
import { DailyTvlImporter } from './daily-tvl.importer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyTVL.name, schema: DailyTVLSchema },
    ]),
    HttpModule,
  ],
  providers: [DailyTvlService, DailyTvlImporter],
  controllers: [DailyTvlController],
})
export class DailyTvlModule {}
