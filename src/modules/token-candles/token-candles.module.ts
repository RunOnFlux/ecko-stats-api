import { Module } from '@nestjs/common';
import { TokenCandlesService } from './token-candles.service';
import { TokenCandlesController } from './token-candles.controller';

@Module({
  providers: [TokenCandlesService],
  controllers: [TokenCandlesController]
})
export class TokenCandlesModule {}
