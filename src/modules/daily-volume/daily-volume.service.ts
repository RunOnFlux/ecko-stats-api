import { Connection, Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DailyVolumeDto } from './dto/create-daily-volume.dto';
import {
  DailyVolume,
  DailyVolumeDocument,
  DailyVolumeSchema,
} from './schemas/daily-volume.schema';

@Injectable()
export class DailyVolumesService {
  constructor(
    @InjectModel(DailyVolume.name)
    private dailyVolumeModel: Model<DailyVolumeDocument>,
    @InjectConnection() private connection: Connection,
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
