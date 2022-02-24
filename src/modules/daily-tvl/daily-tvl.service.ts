import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, mongo } from 'mongoose';
import { lastValueFrom, map } from 'rxjs';
import * as moment from 'moment';
import { DailyTVLDto } from './dto/create-daily-tvl.dto';
import { DailyTVLDocument } from './schemas/daily-tvl.schema';
import { IKSwapExchangeSWAP } from 'src/interfaces/kswap.exchange.SWAP.interface';
import { DailyVolumeSchema } from '../daily-volume/schemas/daily-volume.schema';

@Injectable()
export class DailyTvlService {
  private readonly logger = new ConsoleLogger(DailyTvlService.name);
  constructor(
    //   @InjectModel(DailyVolume.name)
    private dailyVolumeModel: Model<DailyTVLDocument>,
    @InjectConnection() private connection: Connection,
    private readonly httpService: HttpService,
  ) {}
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

  async statsImport(
    eventName: string,
    dayStart?: Date,
    dayEnd?: Date,
  ): Promise<any> {
    this.logger.log('START IMPORT');
    const limit = 100;
    let offset = 0;
    let analyzingData: DailyTVLDto[] = [];

    const dayStartString = dayStart && moment(dayStart).format('YYYY-MM-DD');
    const dayEndString = dayEnd && moment(dayEnd).format('YYYY-MM-DD');

    let hasResult = true;
    let lastDay: string = null;
    const hasDateRange = dayStartString && dayEndString;

    do {
      try {
        const eventsData: any = await this.stats(eventName, limit, offset);
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
          const statFounded = analyzingData.find((st) => {
            return (
              moment(st.day).format('YYYY-MM-DD') ===
                moment(blockTime).format('YYYY-MM-DD') &&
              st.chain === chain &&
              st.tokenFromNamespace === refDataFrom?.refName?.namespace &&
              st.tokenToNamespace === refDataTo?.refName?.namespace
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
              tokenToNamespace: refDataTo?.refName?.namespace,
              tokenFromTVL: 0,
              tokenToTVL: 0,
            });
          }
        }
        // group by pair-chain, order by day, save all days greater then last
        const groupedByPair = _.groupBy(
          analyzingData,
          (analyzedStat: DailyTVLDto) =>
            analyzedStat.tokenFromNamespace +
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
            let ascDay: DailyTVLDto[] = _.orderBy(
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
