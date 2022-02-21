import { HttpService } from '@nestjs/axios';
import { Injectable, ConsoleLogger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import * as _ from 'lodash';
import { IChainwebStat } from './interfaces/chainweb-stat.interface';
import { DailyVolumeDto } from './modules/daily-volume/dto/create-daily-volume.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, mongo } from 'mongoose';
import { DailyVolumeSchema } from './modules/daily-volume/schemas/daily-volume.schema';
import { Command, Console } from 'nestjs-console';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
@Console()
export class AppService {
  private readonly logger = new ConsoleLogger(AppService.name);
  constructor(
    private readonly httpService: HttpService,
    @InjectConnection() private connection: Connection,
  ) {}

  getHello() {
    return {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
    };
  }

  stats(name: string, limit: number, offset: number): any {
    return this.httpService
      .get(`https://estats.chainweb.com/txs/events`, {
        params: {
          name,
          limit,
          offset,
        },
      })
      .pipe(map((response) => response.data));
  }

  @Command({
    command: 'stats:import <eventName>',
    description: 'Import stats for a specific eventName',
  })
  async statsImportCommand(eventName: string) {
    const collections = await this.connection.db.listCollections().toArray();
    if (collections.find((coll) => coll.name === eventName)) {
      this.logger.log('DROPPING COLLECTION ' + eventName);
      await this.connection.db.dropCollection(eventName);
    }
    await this.statsImport(eventName);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async dailyStatsImport() {
    await this.statsImport(
      'kswap.exchange.SWAP',
      moment().subtract(1, 'days').toDate(),
      moment().subtract(1, 'days').toDate(),
    );
  }

  /**
   *
   * @param eventName pact event to analyze (kswap.exchange.SWAP)
   * @param dayStart import start date
   * @param dayEnd import end date
   */
  async statsImport(
    eventName: string,
    dayStart?: Date,
    dayEnd?: Date,
  ): Promise<any> {
    this.logger.log('START IMPORT');
    const limit = 100;
    let offset = 0;
    let analyzingData: DailyVolumeDto[] = [];

    const dayStartString = dayStart && moment(dayStart).format('YYYY-MM-DD');
    const dayEndString = dayEnd && moment(dayEnd).format('YYYY-MM-DD');

    let hasResult = true;
    let lastDay: string = null;
    const hasDateRange = dayStartString && dayEndString;

    do {
      try {
        const eventsData: any = await this.stats(eventName, limit, offset);
        const eventsStat: IChainwebStat[] = await lastValueFrom(eventsData);
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
          const statFounded = analyzingData.find((st) => {
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
            statFounded.tokenFromVolume += tokenFromQuantity;
            statFounded.tokenToVolume += tokenToQuantity;
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

            await this.connection
              .model(eventName, DailyVolumeSchema, eventName)
              .create(ascDay);
            analyzingData = _.differenceBy(analyzingData, ascDay, (t) => {
              return t.id.toString();
            });
          }
        }
        offset += limit;
      } catch (err) {
        this.logger.error(err);
        // continue or try again?
        offset += limit;
      }
    } while (
      hasResult &&
      (!hasDateRange || (hasDateRange && lastDay >= dayStartString))
    );

    this.logger.log('IMPORT TERMINATED FOR ' + eventName);
    process.exit();
  }
}

/**
 * error
 *  ERROR [ExceptionsHandler] kswap.exchange.SWAP validation failed:
 *  tokenToVolume: Cast to Number failed for value "4176.447669860936[object Object]2236.0882866307171131.2700374000191904.5694043171612320.0622012006493550.6186562010093021.8531021861553021.8531021861551100.076108285381928.3025101627411288.397426228652012.7817438181671279.968661811401901.0331557787211202.1148280367782616.280302989999992.33818383623" (type string) at path "tokenToVolume"
 */
