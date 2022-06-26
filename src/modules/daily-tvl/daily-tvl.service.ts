import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, mongo } from 'mongoose';
import { CHAINWEB_ESTATS_URL, getApiBalance } from 'src/utils/chainweb.util';
import {
  DailyTVL,
  DailyTVLDocument,
  DailyTVLSchema,
  TVL_COLLECTION_NAME,
} from './schemas/daily-tvl.schema';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as pact from 'pact-lang-api';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { IKaddexStakingPoolState } from 'src/interfaces/kaddex.staking.get-pool-state.interface';
import { DailyTVLDto } from './dto/daily-tvl.dto';
import { IKSwapExchangeUPDATE } from 'src/interfaces/kswap.exchange.UPDATE.interface';

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
  async dailyStakingTVL() {
    const networkId = process.env.CHAINWEB_NETWORK_ID;
    const chains = Array.from(Array(20).keys());
    for (const chainId of chains) {
      try {
        const pactResponse = await pact.fetch.local(
          {
            pactCode: '(kaddex.staking.get-pool-state)',
            meta: pact.lang.mkMeta(
              '',
              chainId.toString(),
              0.0000001,
              150000,
              Math.round(new Date().getTime() / 1000) - 10,
              600,
            ),
          },
          `${process.env.CHAINWEB_NODE_URL}/chainweb/0.0/${networkId}/chain/${chainId}/pact`,
        );
        const {
          result: { data },
        }: { result: { data: IKaddexStakingPoolState } } = pactResponse;
        const stakingTvlData: DailyTVLDto = {
          id: new mongo.ObjectId(),
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          chain: chainId,
          tokenFrom: 'kaddex.staking-pool-state',
          tokenTo: null,
          tokenFromTVL: getApiBalance(data['staked-kdx']),
          tokenToTVL: null,
        };
        await this.connection
          .model(TVL_COLLECTION_NAME, DailyTVLSchema, TVL_COLLECTION_NAME)
          .create(stakingTvlData);
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   *
   * @param eventName pact event to analyze (kswap.exchange.UPDATE)
   * @param dayStart import start date
   * @param dayEnd import end date
   */
  async tvlImport(
    eventName: string,
    dayStart?: Date,
    dayEnd?: Date,
  ): Promise<any> {
    this.logger.log('START TVL IMPORT');
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
        const eventsData: any = await this.httpService
          .get(CHAINWEB_ESTATS_URL, {
            params: {
              name: eventName,
              limit,
              offset,
            },
          })
          .pipe(map((response) => response.data));
        const eventsStat: IKSwapExchangeUPDATE[] = await lastValueFrom(
          eventsData,
        );
        hasResult = eventsStat?.length > 0;
        for (const stat of eventsStat) {
          const {
            blockTime,
            height,
            blockHash,
            requestKey,
            params: [pairName, token1, token2],
            name,
            idx,
            chain,
            moduleHash,
          } = stat;
          const [tokenFrom, tokenTo] = pairName.split(':');
          const statFounded = analyzingData.find((st) => {
            return (
              moment(st.day).format('YYYY-MM-DD') ===
                moment(blockTime).format('YYYY-MM-DD') &&
              st.chain === chain &&
              st.tokenFrom === tokenFrom &&
              st.tokenTo === tokenTo
            );
          });
          // const objId = new mongo.ObjectId()
          if (!statFounded) {
            this.logger.log(
              `Creating stat for [${pairName}] ${moment(blockTime)
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
              tokenFrom,
              tokenTo,
              tokenFromTVL: getApiBalance(token1),
              tokenToTVL: getApiBalance(token2),
            });
          } else if (statFounded.tokenFromTVL < getApiBalance(token1)) {
            statFounded.tokenFromTVL = getApiBalance(token1);
            statFounded.tokenToTVL = getApiBalance(token2);
          }
        }
        // group by pair-chain, order by day, save all days greater then last
        const groupedByPair = _.groupBy(
          analyzingData,
          (analyzedStat: DailyTVLDto) =>
            analyzedStat.tokenFrom + analyzedStat.tokenTo + analyzedStat.chain,
          ['tokenFromName', 'tokenToName', 'chain'],
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
            ascDay = ascDay.filter(
              (dailyVol) =>
                moment(dailyVol.day).format('YYYY-MM-DD') !=
                moment().format('YYYY-MM-DD'),
            );
            if (dayStart) {
              ascDay = ascDay.filter(
                (dailyTVL) => dailyTVL.dayString >= dayStartString,
              );
            }
            if (dayEnd) {
              ascDay = ascDay.filter(
                (dailyTVL) => dailyTVL.dayString <= dayEndString,
              );
            }

            await this.connection
              .model(TVL_COLLECTION_NAME, DailyTVLSchema, TVL_COLLECTION_NAME)
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
  }
}
