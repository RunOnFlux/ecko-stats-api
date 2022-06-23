import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import * as moment from 'moment';
import { TokenCandlesService } from './token-candles.service';

@Console()
export class TokenCandlesImporter {
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly tokenCandlesService: TokenCandlesService,
  ) {}

  @Command({
    command: 'import:candles',
  })
  async importCandlesCommand() {
    await this.tokenCandlesService.tokenCandlesImport();
  }

  @Command({
    command: 'import:external-candles <asset> <currency> <startDate> <endDate>',
  })
  async importExternalCandlesCommand(
    asset: string,
    currency: string,
    startDate: string,
    endDate: string,
  ) {
    await this.tokenCandlesService.importExternalCandles(
      asset,
      currency,
      moment(startDate).toDate(),
      moment(endDate).toDate(),
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async tokenCandlesImport() {
    await this.tokenCandlesService.tokenCandlesImport(
      moment().subtract(1, 'days').toDate(),
      moment().subtract(1, 'days').toDate(),
    );
  }
}
