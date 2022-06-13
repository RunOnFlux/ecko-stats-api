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
  async candlesImportCommand() {
    await this.tokenCandlesService.tokenCandlesImport();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async tokenCandlesImport() {
    await this.tokenCandlesService.tokenCandlesImport(
      moment().subtract(1, 'days').toDate(),
      moment().subtract(1, 'days').toDate(),
    );
  }
}
