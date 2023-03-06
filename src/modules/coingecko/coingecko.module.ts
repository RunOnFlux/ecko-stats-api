import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoingeckoService } from './coingecko.service';

@Module({
  imports: [HttpModule],
  providers: [CoingeckoService],
  exports: [CoingeckoService],
})
export class CoingeckoModule {}
