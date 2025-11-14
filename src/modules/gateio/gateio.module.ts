import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { GateioService } from './gateio.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [GateioService],
  exports: [GateioService],
})
export class GateioModule {}

