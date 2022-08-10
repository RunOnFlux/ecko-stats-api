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

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  @Command({
    command: 'import:analytics-circulating-supply',
  })
  async analyticsImportCirculatingSupply() {
    await this.analyticsService.importCirculatingSupply();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  @Command({
    command: 'import:analytics-burned',
  })
  async analyticsImportBurned() {
    await this.analyticsService.importBurned();
  }

  @Command({
    command: 'import:analytics-liquidity-mining',
  })
  async analyticsImportLiquidityMining() {
    await this.analyticsService.importLiquidityMining();
  }

  @Command({
    command: 'import:analytics-dao-treasury',
  })
  async analyticsImportDaoTreasury() {
    await this.analyticsService.importDaoTreasury();
  }

  @Command({
    command: 'import:analytics-community-sale',
  })
  async analyticsImportCommunitySale() {
    await this.analyticsService.importCommunitySale();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Command({
    command: 'import:analytics-all',
  })
  async analyticsImportAll() {
    await this.analyticsService.importCirculatingSupply();
    await this.analyticsService.importBurned();
    await this.analyticsService.importLiquidityMining();
    await this.analyticsService.importDaoTreasury();
    await this.analyticsService.importCommunitySale();
  }
}
