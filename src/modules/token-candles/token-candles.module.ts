import { Module } from '@nestjs/common';
import { TokenCandlesService } from './token-candles.service';
import { TokenCandlesController } from './token-candles.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { TokenCandle, TokenCandleSchema } from './schemas/token-candle.schema';
import { TokenCandlesImporter } from './token-candles.importer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenCandle.name, schema: TokenCandleSchema },
    ]),
    HttpModule,
  ],
  providers: [TokenCandlesService, TokenCandlesImporter],
  controllers: [TokenCandlesController],
})
export class TokenCandlesModule {}
