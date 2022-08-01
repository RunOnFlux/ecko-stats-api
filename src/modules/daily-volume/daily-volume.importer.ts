import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import * as moment from 'moment';
import { DailyVolumesService } from './daily-volume.service';
import { VOLUME_COMMAND_NAME } from './schemas/daily-volume.schema';

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

  @Cron(CronExpression.EVERY_30_MINUTES)
  async dailyVolumeImport() {
    await this.dailyVolumesService.volumeImport(
      VOLUME_COMMAND_NAME,
      moment().subtract(1, 'days').toDate(),
      moment().toDate(),
    );
  }
}
