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

  async findAllAggregateByDay(
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

  async findAllAggregateByWeek(
    eventName: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<any> {
    const groupedWeeklyData = await this.connection
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
        {
          $project: {
            tokenToVolume: 1,
            tokenFromVolume: 1,
            startDay: '$day',
            week: { $toString: { $week: '$day' } },
            year: { $toString: { $year: '$day' } },
            tokenFromNamespace: '$tokenFromNamespace',
            tokenFromName: '$tokenFromName',
            tokenToNamespace: '$tokenToNamespace',
            tokenToName: '$tokenToName',
          },
        },
        {
          $group: {
            _id: {
              $concat: [
                '$year',
                '-W',
                '$week',
                '_',
                '$tokenFromName',
                ':',
                '$tokenToName',
              ],
            },
            startDay: { $first: '$startDay' },
            year: { $first: '$year' },
            week: { $first: '$week' },
            tokenFromNamespace: { $first: '$tokenFromNamespace' },
            tokenFromName: { $first: '$tokenFromName' },
            tokenToNamespace: { $first: '$tokenToNamespace' },
            tokenToName: { $first: '$tokenToName' },
            tokenToVolume: { $sum: '$tokenToVolume' },
            tokenFromVolume: { $sum: '$tokenFromVolume' },
          },
        },
        { $sort: { startDay: 1 } },
      ])

      .toArray();
    const groupedByKey = _.groupBy(
      groupedWeeklyData,
      (el) => el._id.split('_')[0],
    );
    return Object.keys(groupedByKey).map((weeklyGroupedKey) => ({
      _id: weeklyGroupedKey,
      volumes: groupedByKey[weeklyGroupedKey],
    }));
  }

  async findAllAggregateByMonth(
    eventName: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<any> {
    const groupedMonthlyData = await this.connection
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
        {
          $project: {
            tokenToVolume: 1,
            tokenFromVolume: 1,
            startDay: '$day',
            month: { $toString: { $month: '$day' } },
            year: { $toString: { $year: '$day' } },
            tokenFromNamespace: '$tokenFromNamespace',
            tokenFromName: '$tokenFromName',
            tokenToNamespace: '$tokenToNamespace',
            tokenToName: '$tokenToName',
          },
        },
        {
          $group: {
            _id: {
              $concat: [
                '$year',
                '-',
                '$month',
                '_',
                '$tokenFromName',
                ':',
                '$tokenToName',
              ],
            },
            startDay: { $last: '$startDay' },
            year: { $first: '$year' },
            month: { $first: '$month' },
            tokenFromNamespace: { $first: '$tokenFromNamespace' },
            tokenFromName: { $first: '$tokenFromName' },
            tokenToNamespace: { $first: '$tokenToNamespace' },
            tokenToName: { $first: '$tokenToName' },
            tokenToVolume: { $sum: '$tokenToVolume' },
            tokenFromVolume: { $sum: '$tokenFromVolume' },
          },
        },
        { $sort: { startDay: 1 } },
      ])
      .toArray();
    const groupedByKey = _.groupBy(
      groupedMonthlyData,
      (el) => el._id.split('_')[0],
    );
    return Object.keys(groupedByKey).map((monthlyGroupedKey) => ({
      _id: monthlyGroupedKey,
      volumes: groupedByKey[monthlyGroupedKey],
    }));
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
