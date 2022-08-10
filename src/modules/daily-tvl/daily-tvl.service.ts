import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, mongo } from 'mongoose';
import {
  CHAINWEB_ESTATS_URL,
  getApiBalance,
  getPairsTVL,
  pactFetchLocal,
} from 'src/utils/chainweb.util';
import {
  DailyTVL,
  DailyTVLDocument,
  DailyTVLSchema,
  TVL_COLLECTION_NAME,
} from './schemas/daily-tvl.schema';
import * as _ from 'lodash';
import * as moment from 'moment';
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
    const chains = Array.from(Array(20).keys());
    for (const chainId of chains) {
      try {
        const pactResponse = await pactFetchLocal(
          chainId,
          '(kaddex.staking.get-pool-state)',
        );
        const {
          result: { data },
        }: { result: { data: IKaddexStakingPoolState } } = pactResponse;
        const collection = this.connection.collection(TVL_COLLECTION_NAME);
        const stakingTvlData: DailyTVLDto = {
          day: moment().hours(0).minutes(0).seconds(0).toDate(),
          dayString: moment().format('YYYY-MM-DD'),
          chain: chainId,
          tokenFrom: 'kaddex.staking-pool-state',
          tokenTo: null,
          tokenFromTVL: getApiBalance(data['staked-kdx']),
          tokenToTVL: null,
        };
        const founded = await collection.findOneAndReplace(
          {
            dayString: moment().format('YYYY-MM-DD'),
            chain: chainId,
            tokenFrom: 'kaddex.staking-pool-state',
            tokenTo: null,
          },
          stakingTvlData,
        );
        if (!founded.value) {
          await this.connection
            .model(TVL_COLLECTION_NAME, DailyTVLSchema, TVL_COLLECTION_NAME)
            .create(stakingTvlData);
        }
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
    let failedAttempt = 0;
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
            const collection = this.connection.collection(TVL_COLLECTION_NAME);
            for (const dailyTvl of ascDay) {
              const founded = await collection.findOneAndReplace(
                {
                  dayString: dailyTvl.dayString,
                  chain: dailyTvl.chain,
                  tokenFrom: dailyTvl.tokenFrom,
                  tokenTo: dailyTvl.tokenTo,
                },
                dailyTvl,
              );
              if (!founded?.value) {
                await this.connection
                  .model(
                    TVL_COLLECTION_NAME,
                    DailyTVLSchema,
                    TVL_COLLECTION_NAME,
                  )
                  .create(dailyTvl);
              } else {
                this.logger.log(
                  `OVERWRITING TVL DATA FOR ${dailyTvl.tokenFrom}/${dailyTvl.tokenTo} [${dailyTvl.dayString}]`,
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
        offset += limit;
      } catch (err) {
        this.logger.error(err);
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
          offset += limit;
        }
      }
    } while (
      hasResult &&
      (!hasDateRange || (hasDateRange && lastDay >= dayStartString))
    );

    this.logger.log('IMPORT TERMINATED FOR ' + eventName);
  }

  async dailyTVLImport() {
    const chains = Array.from(Array(20).keys());
    for (const chainId of chains) {
      try {
        const pairsTVL = await getPairsTVL(chainId);
        for (const pairTVL of pairsTVL) {
          const tvlData: DailyTVLDto = {
            ...pairTVL,
            day: moment().hours(0).minutes(0).seconds(0).toDate(),
            dayString: moment().format('YYYY-MM-DD'),
            chain: chainId,
          };
          const founded = await this.dailyTVLModel.findOneAndReplace(
            {
              dayString: moment().format('YYYY-MM-DD'),
              chain: chainId,
              tokenFrom: pairTVL.tokenFrom,
              tokenTo: pairTVL.tokenTo,
            },
            tvlData,
          );
          if (!founded?._id) {
            await this.dailyTVLModel.create(tvlData);
          }
        }
      } catch (err) {
        this.logger.warn(`Error to retrieve TVL from chain ${chainId}`, err);
      }
    }
  }
}
