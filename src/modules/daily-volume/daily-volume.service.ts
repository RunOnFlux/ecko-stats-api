import { Connection, Model, mongo } from 'mongoose';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import * as _ from 'lodash';
import * as moment from 'moment';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DailyVolume,
  DailyVolumeDocument,
  DailyVolumeSchema,
  VOLUME_COMMAND_NAME,
} from './schemas/daily-volume.schema';
import { Console } from 'nestjs-console';
import { HttpService } from '@nestjs/axios';
import { DailyVolumeDto } from './dto/daily-volume.dto';
import { IKSwapExchangeSWAP } from 'src/interfaces/kswap.exchange.SWAP.interface';
import { CHAINWEB_ESTATS_URL, getApiBalance } from 'src/utils/chainweb.util';

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
    dateStart: Date | string,
    dateEnd: Date | string,
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
    dateStart: Date | string,
    dateEnd: Date | string,
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

  /**
   *
   * @param eventName pact event to analyze (kswap.exchange.SWAP)
   * @param dayStart import start date
   * @param dayEnd import end date
   */
  async volumeImport(
    eventName: string,
    dayStart?: Date,
    dayEnd?: Date,
    saveUncompleted = false,
  ): Promise<any> {
    this.logger.log('START VOLUME IMPORT');
    const limit = 100;
    let chainwebNext: string = null;

    let statFounded = null;
    let analyzingData: DailyVolumeDto[] = [];

    const collection = this.connection.collection(VOLUME_COMMAND_NAME);

    const dayStartString = dayStart && moment(dayStart).format('YYYY-MM-DD');
    const dayEndString = dayEnd && moment(dayEnd).format('YYYY-MM-DD');

    let hasResult = true;
    let lastDay: string = null;
    const hasDateRange = dayStartString && dayEndString;
    let failedAttempt = 0;
    do {
      try {
        const eventsData: any = await this.httpService
          .get(CHAINWEB_ESTATS_URL, {
            params: {
              search: eventName,
              limit,
              next: chainwebNext !== null ? chainwebNext : undefined,
            },
          })
          .pipe(
            map((response) => {
              chainwebNext = response.headers['chainweb-next'];
              return response.data;
            }),
          );

        const eventsStat: IKSwapExchangeSWAP[] = await lastValueFrom(
          eventsData,
        );

        hasResult = eventsStat?.length > 0;
        for (const stat of eventsStat) {
          const {
            blockTime,
            chain,
            params: [
              ,
              ,
              tokenFromQuantity,
              refDataFrom,
              tokenToQuantity,
              refDataTo,
            ],
          } = stat;
          statFounded = analyzingData.find((st) => {
            return (
              moment(st.day).format('YYYY-MM-DD') ===
                moment(blockTime).format('YYYY-MM-DD') &&
              st.chain === chain &&
              st.tokenFromName === refDataFrom?.refName?.name &&
              st.tokenFromNamespace === refDataFrom?.refName?.namespace &&
              st.tokenToNamespace === refDataTo?.refName?.namespace &&
              st.tokenToName === refDataTo?.refName?.name
            );
          });
          // const objId = new mongo.ObjectId()
          if (!statFounded) {
            this.logger.log(
              `Creating stat for [${refDataFrom?.refName?.name}:${
                refDataTo?.refName?.name
              }] ${moment(blockTime)
                .hours(0)
                .minutes(0)
                .seconds(0)
                .format('YYYY-MM-DD')}`,
            );
            analyzingData.push({
              id: new mongo.ObjectId(),
              day: moment(blockTime).hours(0).minutes(0).seconds(0).toDate(),
              dayString: moment(blockTime).format('YYYY-MM-DD'),
              chain,
              tokenFromNamespace: refDataFrom?.refName?.namespace,
              tokenFromName: refDataFrom?.refName?.name,
              tokenToNamespace: refDataTo?.refName?.namespace,
              tokenToName: refDataTo?.refName?.name,
              tokenFromVolume: 0,
              tokenToVolume: 0,
            });
          } else {
            statFounded.tokenFromVolume += getApiBalance(tokenFromQuantity);
            statFounded.tokenToVolume += getApiBalance(tokenToQuantity);
          }
        }
        // group by pair-chain, order by day, save all days greater then last
        const groupedByPair = _.groupBy(
          analyzingData,
          (analyzedStat: DailyVolumeDto) =>
            analyzedStat.tokenFromName +
            analyzedStat.tokenFromNamespace +
            analyzedStat.tokenToName +
            analyzedStat.tokenToNamespace +
            analyzedStat.chain,
          [
            'tokenFromName',
            'tokenFromNamespace',
            'tokenToName',
            'tokenToNamespace',
            'chain',
          ],
        );
        for (const key of Object.keys(groupedByPair)) {
          if (groupedByPair[key].length > 1) {
            // I'm sure past days are completed
            let ascDay: DailyVolumeDto[] = _.orderBy(
              groupedByPair[key],
              ['day'],
              ['desc'],
            );
            lastDay = ascDay.pop().dayString;
            if (dayStart) {
              ascDay = ascDay.filter(
                (dailyVol) => dailyVol.dayString >= dayStartString,
              );
            }
            if (dayEnd) {
              ascDay = ascDay.filter(
                (dailyVol) => dailyVol.dayString <= dayEndString,
              );
            }
            for (const dailyVolume of ascDay) {
              const founded = await collection.findOneAndReplace(
                {
                  dayString: dailyVolume.dayString,
                  chain: dailyVolume.chain,
                  tokenFromNamespace: dailyVolume.tokenFromNamespace,
                  tokenFromName: dailyVolume.tokenFromName,
                  tokenToNamespace: dailyVolume.tokenToNamespace,
                  tokenToName: dailyVolume.tokenToName,
                },
                dailyVolume,
              );
              if (!founded.value) {
                await this.connection
                  .model(
                    VOLUME_COMMAND_NAME,
                    DailyVolumeSchema,
                    VOLUME_COMMAND_NAME,
                  )
                  .create(dailyVolume);
              } else {
                this.logger.log(
                  `FOUNDED VOLUME FOR ${dailyVolume.tokenFromNamespace}.${dailyVolume.tokenFromName}/${dailyVolume.tokenToNamespace}.${dailyVolume.tokenToName} [${dailyVolume.dayString}]`,
                );
              }
            }

            analyzingData = _.differenceBy(analyzingData, ascDay, (t) => {
              return t.id.toString();
            });
          } else {
            lastDay = groupedByPair[key] && groupedByPair[key][0]?.dayString;
          }
        }
        failedAttempt = 0;
      } catch (err) {
        this.logger.error(err);
        this.logger.debug(statFounded);
        this.logger.debug({ limit, chainwebNext });
        // continue or try again?
        if (failedAttempt < 5) {
          failedAttempt += 1;
          // wait 10sec
          this.logger.log(
            `FAILED ATTEMPT = ${failedAttempt} - waiting for 10 sec`,
          );
          await new Promise((resolve) => setTimeout(resolve, 10000));
        } else {
          this.logger.log(`RESTORE FAILED ATTEMPT AND SKIP THIS PAGE`);
          failedAttempt = 0;
          //offset += limit;
        }
      }
    } while (
      hasResult &&
      (!hasDateRange || (hasDateRange && lastDay >= dayStartString))
    );
    if (saveUncompleted) {
      for (const dailyVolume of analyzingData) {
        const founded = await collection.findOneAndReplace(
          {
            dayString: dailyVolume.dayString,
            chain: dailyVolume.chain,
            tokenFromNamespace: dailyVolume.tokenFromNamespace,
            tokenFromName: dailyVolume.tokenFromName,
            tokenToNamespace: dailyVolume.tokenToNamespace,
            tokenToName: dailyVolume.tokenToName,
          },
          dailyVolume,
        );
        if (!founded.value) {
          await this.connection
            .model(VOLUME_COMMAND_NAME, DailyVolumeSchema, VOLUME_COMMAND_NAME)
            .create(dailyVolume);
        } else {
          this.logger.log(
            `FOUNDED VOLUME FOR ${dailyVolume.tokenFromNamespace}.${dailyVolume.tokenFromName}/${dailyVolume.tokenToNamespace}.${dailyVolume.tokenToName} [${dailyVolume.dayString}]`,
          );
        }
      }
    }

    this.logger.log('IMPORT TERMINATED FOR ' + eventName);
  }
}
