import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import { ChainDataService } from './chain-data.service';

@Console()
export class ChainDataImporter {
  private readonly logger = new ConsoleLogger(ChainDataImporter.name);
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly chainDataService: ChainDataService,
  ) {}

  @Command({
    command: 'import:chain-data',
  })
  @Cron(CronExpression.EVERY_2_HOURS)
  async chainDataImportCommand() {
    await this.chainDataService.fetchChainsFungibleTokens();
  }
}
