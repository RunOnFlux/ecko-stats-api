import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import * as moment from 'moment';
import { DailyVolumesService } from './daily-volume.service';

@Console()
export class DailyVolumeImporter {
  private readonly logger = new ConsoleLogger(DailyVolumeImporter.name);
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly dailyVolumesService: DailyVolumesService,
  ) {}

  @Command({
    command: 'import:volume <eventName>',
  })
  async volumeImportCommand(eventName: string) {
    const collections = await this.connection.db.listCollections().toArray();
    if (collections.find((coll) => coll.name === eventName)) {
      this.logger.log('DROPPING COLLECTION ' + eventName);
      await this.connection.db.dropCollection(eventName);
    }
    await this.dailyVolumesService.volumeImport(eventName);
  }

  @Command({
    command: 'update:volume <eventName> <saveUncompleted>',
  })
  async volumeUpdateCommand(eventName: string, saveUncompleted: string) {
    await this.dailyVolumesService.volumeImport(
      eventName,
      null,
      null,
      saveUncompleted === '1',
    );
  }

  @Command({
    command: 'import:volume-daily <saveUncompleted>',
  })
  async dailyVolumeImportCommand(saveUncompleted: string) {
    await this.dailyVolumesService.volumeImport(
      'kaddex.exchange.SWAP',
      moment().subtract(1, 'days').toDate(),
      moment().toDate(),
      saveUncompleted === '1',
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async dailyVolumeImport() {
    await this.dailyVolumesService.volumeImport(
      'kaddex.exchange.SWAP',
      moment().subtract(1, 'days').toDate(),
      moment().toDate(),
      false,
    );
  }
}
