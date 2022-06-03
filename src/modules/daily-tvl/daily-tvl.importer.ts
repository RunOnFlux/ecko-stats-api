import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import * as moment from 'moment';
import { DailyTvlService } from './daily-tvl.service';
import {
  TVL_COLLECTION_NAME,
  TVL_COMMAND_NAME,
} from './schemas/daily-tvl.schema';

@Console()
export class DailyTvlImporter {
  private readonly logger = new ConsoleLogger(DailyTvlImporter.name);
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly dailyTvlService: DailyTvlService,
  ) {}

  @Command({
    command: 'import:tvl <eventName>',
  })
  async tvlImportCommand(eventName: string) {
    const collections = await this.connection.db.listCollections().toArray();
    if (collections.find((coll) => coll.name === TVL_COLLECTION_NAME)) {
      this.logger.log('CLEAN COLLECTION ' + TVL_COLLECTION_NAME);
      const deleted = await this.connection.db
        .collection(TVL_COLLECTION_NAME)
        .deleteMany({ tokenFrom: { $ne: 'kaddex.staking-pool-state' } });
      const stakingDelete = await this.connection.db
        .collection(TVL_COLLECTION_NAME)
        .deleteMany({
          dayString: moment().format('YYYY-MM-DD'),
          tokenFrom: 'kaddex.staking-pool-state',
        });
      this.logger.log('DELETED ' + deleted?.deletedCount + ' RECORDS');
      this.logger.log(
        'DELETED STAKING ' + stakingDelete?.deletedCount + ' RECORDS',
      );
    }
    await this.dailyTvlService.tvlImport(eventName);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async dailyTVLImport() {
    await this.dailyTvlService.tvlImport(
      TVL_COMMAND_NAME,
      moment().subtract(1, 'days').toDate(),
      moment().subtract(1, 'days').toDate(),
    );
    await this.dailyTvlService.dailyStakingTVL();
  }
}
