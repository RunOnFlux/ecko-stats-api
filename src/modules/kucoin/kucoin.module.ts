import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { KucoinService } from './kucoin.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [KucoinService],
  exports: [KucoinService],
})
export class KucoinModule {}
