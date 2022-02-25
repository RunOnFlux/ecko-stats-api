import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { DailyTVL, DailyTVLDocument } from './schemas/daily-tvl.schema';

@Injectable()
export class DailyTvlService {
  private readonly logger = new ConsoleLogger(DailyTvlService.name);
  constructor(
    @InjectModel(DailyTVL.name)
    private dailyTVLModel: Model<DailyTVLDocument>,
    @InjectConnection() private connection: Connection,
    private readonly httpService: HttpService,
  ) {}

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
        { $group: { _id: '$dayString', tvl: { $push: '$$ROOT' } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
  }
}
