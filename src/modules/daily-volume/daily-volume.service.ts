import { Connection, Model } from 'mongoose';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import {
  DailyVolume,
  DailyVolumeDocument,
  DailyVolumeSchema,
} from './schemas/daily-volume.schema';
import { Console } from 'nestjs-console';
import { HttpService } from '@nestjs/axios';
import { DailyVolumeDto } from './dto/daily-volume.dto';

@Console()
@Injectable()
export class DailyVolumesService {
  private readonly logger = new ConsoleLogger(DailyVolumesService.name);
  constructor(
    @InjectModel(DailyVolume.name)
    private dailyVolumeModel: Model<DailyVolumeDocument>,
    @InjectConnection() private connection: Connection,
    private readonly httpService: HttpService,
  ) {}

  async findAll(
    eventName: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<any[]> {
    return await this.connection
      .collection(eventName)
      .find({
        dayString: {
          $gte: dateStart,
          $lte: dateEnd,
        },
      })
      .sort('dayString')
      .toArray();
  }

  async findAllAggregate(
    eventName: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<any> {
    return await this.connection
      .collection(eventName)
      .aggregate([
        {
          $match: {
            dayString: {
              $gte: dateStart,
              $lte: dateEnd,
            },
          },
        },
        { $group: { _id: '$dayString', volumes: { $push: '$$ROOT' } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
  }

  async create(
    collectionName: string,
    createDailyVolume: DailyVolumeDto,
  ): Promise<any> {
    const document = await this.connection
      .model(collectionName, DailyVolumeSchema)
      .create(createDailyVolume);
    return document;
  }
}
