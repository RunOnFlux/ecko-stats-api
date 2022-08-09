import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import * as moment from 'moment';
import { AnalyticsService } from './analytics.service';

@Console()
export class AnalyticsImporter {
  private readonly logger = new ConsoleLogger(AnalyticsImporter.name);
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Command({
    command: 'import:analytics-circulating-supply',
  })
  async analyticsImportCirculatingSupply() {
    await this.analyticsService.importCirculatingSupply();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Command({
    command: 'import:analytics-burned',
  })
  async analyticsImportBurned() {
    await this.analyticsService.importBurned();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Command({
    command: 'import:analytics-liquidity-mining',
  })
  async analyticsImportLiquidityMining() {
    await this.analyticsService.importLiquidityMining();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Command({
    command: 'import:analytics-dao-treasury',
  })
  async analyticsImportDaoTreasury() {
    await this.analyticsService.importDaoTreasury();
  }
}
