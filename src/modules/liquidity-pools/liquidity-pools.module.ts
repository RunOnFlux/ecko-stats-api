import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from '../analytics/analytics.module';
import { LiquidityPoolsImporter } from './liquidity-pools.importer';
import { LiquidityPoolsService } from './liquidity-pools.service';
import {
  LiquidityPools,
  LiquidityPoolsSchema,
} from './schemas/liquidity-pools.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LiquidityPools.name, schema: LiquidityPoolsSchema },
    ]),
    AnalyticsModule,
  ],
  providers: [LiquidityPoolsService, LiquidityPoolsImporter],
})
export class LiquidityPoolsModule {}
