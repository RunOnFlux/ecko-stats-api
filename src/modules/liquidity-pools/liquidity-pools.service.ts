import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import { BLACKLISTED_TOKENS } from 'src/data/tokens';
import { AnalyticsService } from '../analytics/analytics.service';
import { GetPoolLiquidityResponse } from './interfaces';
import {
  LiquidityPools,
  LiquidityPoolsDocument,
} from './schemas/liquidity-pools.schema';

@Injectable()
export class LiquidityPoolsService {
  private readonly logger = new ConsoleLogger(LiquidityPoolsService.name);

  private readonly NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly BASE_URL = process.env.CHAINWEB_NODE_URL;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly URL = `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/${this.CHAIN_ID}/pact`;

  constructor(
    @InjectModel(LiquidityPools.name)
    private liquidityPoolsModel: Model<LiquidityPoolsDocument>,
    private analyticsService: AnalyticsService,
  ) {}

  async handleImportLiquidityPools(pairCode: string) {
    this.logger.log(`LIQUIDITY POOL IMPORT START FOR: ${pairCode}`);
    try {
      const pairs = await this.analyticsService.getPairsFromExchange();
      const tokenPairList = pairs
        .filter((x) => x === pairCode)
        .reduce((accum, pair) => {
          const tokenCodes = pair.split(':');
          if (
            !BLACKLISTED_TOKENS.some(
              (x) => x === tokenCodes[0] || x === tokenCodes[1],
            )
          ) {
            accum += `[${tokenCodes.join(' ')}] `;
          }
          return accum;
        }, '');

      if (!tokenPairList) {
        this.logger.error('Pair not found!');
        return;
      }

      const data: GetPoolLiquidityResponse[] = await getPoolLiquidities(
        tokenPairList,
        this.CHAIN_ID.toString(),
        this.URL,
      );

      if (data) {
        for (const item of data) {
          const {
            pairCode,
            mappedItem,
          }: { pairCode: string; mappedItem: LiquidityPools } =
            this.mapItem(item);

          const founded = await this.liquidityPoolsModel.findOneAndReplace(
            { chain: Number(this.CHAIN_ID), pairCode },
            mappedItem,
          );

          if (!founded) {
            await this.liquidityPoolsModel.create(mappedItem);
          }
        }
      }
      this.logger.log(`LIQUIDITY POOL IMPORT END FOR: ${pairCode}`);
      return data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async handleImportAllLiquidityPools() {
    try {
      const pairs = await this.analyticsService.getPairsFromExchange();
      const tokenPairList = pairs.reduce((accum, pair) => {
        const tokenCodes = pair.split(':');
        if (
          !BLACKLISTED_TOKENS.some(
            (x) => x === tokenCodes[0] || x === tokenCodes[1],
          )
        ) {
          accum += `[${tokenCodes.join(' ')}] `;
        }
        return accum;
      }, '');

      const data: GetPoolLiquidityResponse[] = await getPoolLiquidities(
        tokenPairList,
        this.CHAIN_ID.toString(),
        this.URL,
      );

      if (data) {
        for (const item of data) {
          const {
            pairCode,
            mappedItem,
          }: { pairCode: string; mappedItem: LiquidityPools } =
            this.mapItem(item);

          const founded = await this.liquidityPoolsModel.findOneAndReplace(
            { chain: Number(this.CHAIN_ID), pairCode },
            mappedItem,
          );

          if (!founded) {
            await this.liquidityPoolsModel.create(mappedItem);
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  private mapItem(item: GetPoolLiquidityResponse) {
    const tokenFromCode = item.token0.refName.namespace
      ? `${item.token0.refName.namespace}.${item.token0.refName.name}`
      : `${item.token0.refName.name}`;

    const tokenToCode = item.token1.refName.namespace
      ? `${item.token1.refName.namespace}.${item.token1.refName.name}`
      : `${item.token1.refName.name}`;

    const pairCode = `${tokenFromCode}:${tokenToCode}`;

    const mappedItem: LiquidityPools = {
      timestamp: new Date(),
      pairCode,
      chain: Number(this.CHAIN_ID),
      tokenFrom: tokenFromCode,
      tokenTo: tokenToCode,
      tokenFromTVL:
        typeof item.reserve0 !== 'number'
          ? Number(item.reserve0.decimal)
          : item.reserve0,
      tokenToTVL:
        typeof item.reserve1 !== 'number'
          ? Number(item.reserve1.decimal)
          : item.reserve1,
    };
    return { pairCode, mappedItem };
  }
}

const getPoolLiquidities = async (
  tokenPairList: string,
  chainId: string,
  url: string,
) => {
  const pactCode = `(let
        ((get-pool-liquidity
           (lambda (pairList:list)
             (let*
               (
                (token0 (at 0 pairList))
                (token1 (at 1 pairList))
                (p (kaddex.exchange.get-pair token0 token1))
                (reserve0 (kaddex.exchange.reserve-for p token0))
                (reserve1 (kaddex.exchange.reserve-for p token1))
                (total-supply (kaddex.tokens.total-supply (kaddex.exchange.get-pair-key token0 token1)))
               )
             {"token0": token0, "token1":token1, "reserve0": reserve0, "reserve1": reserve1, "totalSupply": total-supply}
             )
           )
         )
        )
        (map (get-pool-liquidity) [${tokenPairList}])
        )`;
  const pactResponse = await pact.fetch.local(
    {
      pactCode,
      meta: pact.lang.mkMeta(
        '',
        chainId.toString(),
        0.0000001,
        150000,
        Math.round(new Date().getTime() / 1000) - 10,
        600,
      ),
    },
    url,
  );
  const {
    result: { data },
  }: { result: { data: GetPoolLiquidityResponse[] } } = pactResponse;

  return data;
};
