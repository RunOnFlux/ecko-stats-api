import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import { LiquidityPoolsService } from './liquidity-pools.service';

@Console()
export class LiquidityPoolsImporter {
  private readonly logger = new ConsoleLogger(LiquidityPoolsImporter.name);
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly liquidityPoolsService: LiquidityPoolsService,
  ) {}

  @Command({
    command: 'import:liquidity-pools <pairCode>',
  })
  async liquidityPoolsImportCommand(pairCode: string) {
    await this.liquidityPoolsService.handleImportLiquidityPools(pairCode);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  @Command({
    command: 'import:all-liquidity-pools',
  })
  async allLiquidityPoolsImportCommand() {
    await this.liquidityPoolsService.handleImportAllLiquidityPools();
  }
}
