import { ConsoleLogger, OnModuleInit } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TOKENS } from './data/tokens';
import { TokenDataService } from './modules/token-data/token-data.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new ConsoleLogger(AppService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private tokenDataService: TokenDataService,
  ) {}

  onModuleInit() {
    for (const [key, value] of Object.entries(TOKENS)) {
      if (value.supplyConfig) {
        const job = new CronJob(value.supplyConfig.cron, () => {
          this.logger.log(`time for token-data job ${key} to run!`);
          this.tokenDataService.handleTokenData(
            key,
            value.supplyConfig.tokenTableName,
            value.supplyConfig.balanceFieldName,
            value.supplyConfig.liquidityHolderAccounts,
          );
        });

        this.schedulerRegistry.addCronJob(key, job);
        job.start();

        this.logger.log(
          `job ${key} added! - Next start: ${job
            .nextDate()
            .format('YYYY-MM-DD HH:mm:ss')}`,
        );
      }
    }
  }

  getHello() {
    return {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
    };
  }
}
