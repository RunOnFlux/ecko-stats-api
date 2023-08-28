import {
  CACHE_MANAGER,
  ConsoleLogger,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Model, Connection, mongo } from 'mongoose';
import {
  TokenCandle,
  TokenCandleDocument,
} from './schemas/token-candle.schema';
import {
  CHAINWEB_ESTATS_URL,
  getApiBalance,
  isKdaCoin,
} from 'src/utils/chainweb.util';
import { VOLUME_COMMAND_NAME } from '../daily-volume/schemas/daily-volume.schema';
import { lastValueFrom, map } from 'rxjs';
import {
  IKSwapExchangeSWAP,
  IRefData,
} from 'src/interfaces/kswap.exchange.SWAP.interface';
import { KucoinService } from '../kucoin/kucoin.service';
import { GetCandlesResponse } from '../kucoin/interfaces/kucoin.interfaces';

export const KUCOIN_CANDLES_CACHE_PREFIX = 'kucoin-kda-usdt';

@Injectable()
export class TokenCandlesService {
  private readonly logger = new ConsoleLogger(TokenCandlesService.name);
  constructor(
    @InjectModel(TokenCandle.name)
    private tokenCandlesModel: Model<TokenCandleDocument>,
    @InjectConnection() private connection: Connection,
    private readonly httpService: HttpService,
    private readonly kucoinService: KucoinService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findAll(
    pairName: string,
    dateStart: Date | string,
    dateEnd: Date | string,
  ): Promise<any[]> {
    const collections = await this.connection.db.listCollections().toArray();
    if (!collections.find((c) => c.name === `candles__${pairName}`)) {
      return [];
    }

    return await this.connection
      .collection(`candles__${pairName}`)
      .find({
        dayString: {
          $gte: dateStart,
          $lte: dateEnd,
        },
      })
      .sort('dayString', 'asc')
      .toArray();
  }

  getVolume(swapData: IKSwapExchangeSWAP): number {
    const {
      params: [, , tokenFromQuantity, refDataFrom, tokenToQuantity],
    } = swapData;
    if (isKdaCoin(refDataFrom)) {
      return getApiBalance(tokenFromQuantity);
    } else {
      return getApiBalance(tokenToQuantity);
    }
  }

  getKdaSwapPrice(swapData: IKSwapExchangeSWAP): number {
    const {
      params: [, , tokenFromQuantity, refDataFrom, tokenToQuantity, refDataTo],
    } = swapData;
    if (!isKdaCoin(refDataFrom)) {
      return getApiBalance(tokenToQuantity) / getApiBalance(tokenFromQuantity);
    } else {
      return getApiBalance(tokenFromQuantity) / getApiBalance(tokenToQuantity);
    }
  }

  getPairName(refDataFrom: IRefData, refDataTo: IRefData): string {
    if (isKdaCoin(refDataFrom)) {
      return `${refDataTo.refName.namespace}.${refDataTo.refName.name}/coin`;
    } else if (isKdaCoin(refDataTo)) {
      return `${refDataFrom.refName.namespace}.${refDataFrom.refName.name}/coin`;
    } else {
      const nameFrom = `${refDataFrom.refName.namespace}.${refDataFrom.refName.name}`;
      const nameTo = `${refDataTo.refName.namespace}.${refDataTo.refName.name}`;
      return [nameFrom, nameTo].sort((a, b) => a.localeCompare(b)).join('/');
    }
  }

  async getKdaUsdCandle(day: Date): Promise<GetCandlesResponse> {
    const value: GetCandlesResponse = await this.cacheManager.get(
      `${KUCOIN_CANDLES_CACHE_PREFIX}-${moment(day).format('YYYY-MM-DD')}`,
    );
    // let candle = null;
    if (!value) {
      const candles = await this.kucoinService.getCandles({
        symbol: 'KDA-USDT',
        startAt: moment(day).subtract(20, 'days').unix(),
        endAt: moment(day).add(1, 'days').unix(),
        type: '1day',
      });
      for (const c of candles) {
        await this.cacheManager.set(
          `${KUCOIN_CANDLES_CACHE_PREFIX}-${c.timeString}`,
          c,
          { ttl: 3600 },
        );
      }
      return candles?.find(
        (candle) => candle.timeString === moment(day).format('YYYY-MM-DD'),
      );
    } else {
      return value;
    }
  }

  async tokenCandlesImport(dayStart?: Date, dayEnd?: Date): Promise<void> {
    this.logger.log('CANDLES IMPORT START');
    const limit = 100;
    let chainwebNext: string = null;

    let candleFounded: TokenCandle = null;
    let processingCandles: TokenCandle[] = [];

    const dayStartString =
      dayStart && moment(dayStart).utc().format('YYYY-MM-DD');
    const dayEndString = dayEnd && moment(dayEnd).utc().format('YYYY-MM-DD');
    let hasResult = true;
    let lastDay: string = moment(dayEnd).utc().format('YYYY-MM-DD');
    const hasDateRange = dayStartString && dayEndString;

    do {
      try {
        const eventsData: any = await this.httpService
          .get(CHAINWEB_ESTATS_URL, {
            params: {
              search: 'kaddex.exchange.SWAP',
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
            params: [, , , refDataFrom, , refDataTo],
          } = stat;

          const pairName = this.getPairName(refDataFrom, refDataTo);
          candleFounded = processingCandles.find((st) => {
            return (
              moment(st.day).format('YYYY-MM-DD') ===
                moment(blockTime)
                  .hours(0)
                  .minutes(0)
                  .seconds(0)
                  .format('YYYY-MM-DD') &&
              st.chain === chain &&
              st.pairName === pairName
            );
          });

          const kdaUsdCandle = await this.getKdaUsdCandle(
            moment(blockTime).toDate(),
          );
          const kdaUsdPrice = kdaUsdCandle?.close ?? 0;
          if (!candleFounded) {
            this.logger.log(
              `Creating candle for [${pairName}] ${moment(blockTime)
                .hours(0)
                .minutes(0)
                .seconds(0)
                .format('YYYY-MM-DD')}`,
            );
            const kdaPrice = this.getKdaSwapPrice(stat);
            const usdPrice = kdaPrice * kdaUsdPrice;
            processingCandles.push({
              id: new mongo.ObjectId(),
              day: moment(blockTime).hours(0).minutes(0).seconds(0).toDate(),
              dayString: moment(blockTime).format('YYYY-MM-DD'),
              chain,
              pairName,
              price: {
                open: kdaPrice,
                close: kdaPrice, // save the price
                high: kdaPrice,
                low: kdaPrice,
              },
              usdPrice: {
                open: usdPrice,
                close: usdPrice,
                high: usdPrice,
                low: usdPrice,
              },

              volume: this.getVolume(stat),
            } as any);
          } else {
            const candlePrice = this.getKdaSwapPrice(stat);
            const candlePriceUsd = this.getKdaSwapPrice(stat) * kdaUsdPrice;
            if (candlePrice > candleFounded.price?.high) {
              candleFounded.price.high = candlePrice;
              candleFounded.usdPrice.high = candlePriceUsd;
            }
            if (candlePrice < candleFounded.price.low) {
              candleFounded.price.low = candlePrice;
              candleFounded.usdPrice.low = candlePriceUsd;
            }
            candleFounded.price.open = candlePrice;
            candleFounded.usdPrice.open = candlePriceUsd;
            candleFounded.volume += this.getVolume(stat);
          }
        }
        // group by pair-chain, order by day, save all days greater then the last one
        const groupedByPair = _.groupBy(
          processingCandles,
          (analyzedStat: TokenCandle) =>
            analyzedStat.pairName + analyzedStat.chain,
        );
        for (const key of Object.keys(groupedByPair)) {
          if (groupedByPair[key].length > 1) {
            // Save past days (I'm sure are completed)
            let ascDay: TokenCandle[] = _.orderBy(
              groupedByPair[key],
              ['dayString'],
              ['desc'],
            );
            lastDay = ascDay.pop().dayString;
            if (dayStart) {
              ascDay = ascDay.filter(
                (candle) => candle.dayString >= dayStartString,
              );
            }
            if (dayEnd) {
              ascDay = ascDay.filter(
                (candle) => candle.dayString <= dayEndString,
              );
            }
            if (ascDay.length) {
              const collectionName = `candles__${ascDay[0].pairName}`;
              const collection = this.connection.collection(collectionName);
              for (const candleSave of ascDay) {
                const founded = await collection.findOneAndReplace(
                  {
                    pairName: candleSave.pairName,
                    chain: candleSave.chain,
                    dayString: candleSave.dayString,
                  },
                  candleSave,
                );
                if (!founded.value) {
                  await collection.insertOne(candleSave);
                }
              }
            }

            processingCandles = _.differenceBy(
              processingCandles,
              ascDay,
              (t) => {
                return t.id.toString();
              },
            );
          } else {
            lastDay = groupedByPair[key] && groupedByPair[key][0]?.dayString;
          }
        }
      } catch (err) {
        this.logger.error(err);
        this.logger.debug(candleFounded);
        this.logger.debug({ limit, chainwebNext });
        // continue or try again?
        //offset += limit;
      }
    } while (
      hasResult &&
      (!hasDateRange || (hasDateRange && lastDay >= dayStartString))
    );
    for (const candleSave of processingCandles) {
      const collectionName = `candles__${candleSave.pairName}`;
      const collection = this.connection.collection(collectionName);
      const founded = await collection.findOneAndReplace(
        {
          pairName: candleSave.pairName,
          chain: candleSave.chain,
          dayString: candleSave.dayString,
        },
        candleSave,
      );
      if (!founded.value) {
        await collection.insertOne(candleSave);
      }
    }

    this.logger.log('CANDLES IMPORT FINISH');
  }

  async importExternalCandles(
    asset: string,
    currency: string,
    dateStart: Date,
    dateEnd: Date,
  ) {
    this.logger.log(
      `START EXTERNAL CANDLES IMPORT FOR ${asset}/${currency} (${moment(
        dateStart,
      ).format('YYYY/MM/DD')} - ${moment(dateEnd).format('YYYY/MM/DD')})`,
    );
    this.logger.log(` ${asset}/${currency}`);
    const collectionName = `candles__${asset}/${currency}`;
    const collection = this.connection.collection(collectionName);
    const dayLimit = 100;
    let startUnix = moment(dateStart).unix();
    let limitUnix = moment(dateStart).add(dayLimit, 'days').unix();
    do {
      const candles = await this.kucoinService.getCandles({
        symbol: `${asset}-${currency}`,
        startAt: startUnix,
        endAt: limitUnix,
        type: '1day',
      });
      for (const c of candles) {
        const candle = {
          id: new mongo.ObjectId(),
          day: moment(c.timeString).hours(0).minutes(0).seconds(0).toDate(),
          dayString: c.timeString,
          chain: null,
          pairName: `${asset}/${currency}`,
          volume: c.volume,
          price: {
            open: c.open,
            close: c.close,
            high: c.high,
            low: c.low,
          },
        };
        this.logger.log(`SAVE CANDLE ${c.timeString}`);
        const founded = await collection.findOneAndReplace(
          {
            pairName: `${asset}/${currency}`,
            dayString: c.timeString,
          },
          candle,
        );
        if (!founded.value) {
          await collection.insertOne(candle);
        }
      }
      startUnix = limitUnix;
      limitUnix = moment.unix(limitUnix).add(dayLimit, 'days').unix();
    } while (startUnix <= moment(dateEnd).unix());
    this.logger.log('CANDLES IMPORT FINISH');
  }
}
