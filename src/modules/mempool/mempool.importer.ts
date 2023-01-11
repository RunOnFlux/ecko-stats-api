import { ConsoleLogger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { MempoolService } from './mempool.service';

@Console()
export class MempoolImporter {
  private readonly logger = new ConsoleLogger(MempoolImporter.name);
  constructor(private readonly mempoolService: MempoolService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  @Command({
    command: 'import:mempool-gas-data',
  })
  async mempoolImportGasData() {
    await this.mempoolService.importGasData();
  }
}
