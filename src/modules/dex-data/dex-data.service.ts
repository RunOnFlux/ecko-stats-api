import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as _ from 'lodash';
import * as pact from 'pact-lang-api';
import * as moment from 'moment';
import { PAIR_TOKENS, TOKENS } from 'src/data/tokens';
import { extractDecimal } from 'src/utils/pact-data.utils';
import { TVL_COLLECTION_NAME } from '../daily-tvl/schemas/daily-tvl.schema';
import { CMMTickerResponseDto } from './dto/CMMTicker.dto';
import { PairDto } from './dto/pair.dto';
import { CoingeckoTickerDto } from './dto/CoingeckoTicker.dto';
import { TickerDto } from './dto/ticker.dto';
import { LIQUIDITY_POOLS_COLLECTION_NAME } from '../liquidity-pools/schemas/liquidity-pools.schema';

@Injectable()
export class DexDataService {
  private readonly logger = new ConsoleLogger(DexDataService.name);
  private readonly NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly BASE_URL = process.env.CHAINWEB_NODE_URL;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly URL = `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/${this.CHAIN_ID}/pact`;

  constructor(@InjectConnection() private connection: Connection) {}

  getPairs(): PairDto[] {
    const result: PairDto[] = Object.values(PAIR_TOKENS).map((x) => ({
      ticker_id: `${x.token0.name}_${x.token1.name}`,
      base: x.token0.name,
      target: x.token1.name,
      pool_id: x.name,
    }));
    return result;
  }

  private async computeTickersPairsData(
    volumes: any,
    kdaUsdPrice: number,
  ): Promise<TickerDto[]> {
    const result: TickerDto[] = [];
    const pairs = this.getPairs();
    const liquidities = await this.connection
      .collection(LIQUIDITY_POOLS_COLLECTION_NAME)
      .find({
        chain: Number(this.CHAIN_ID),
      })
      .toArray();
    for (const pair of pairs) {
      const pairTokensCode = pair.pool_id.split(':');
      const baseTokenData = TOKENS[pairTokensCode[0]];
      const targetTokenData = TOKENS[pairTokensCode[1]];

      const baseTokenCodeSplitted = baseTokenData.code.split('.');
      const targetTokenCodeSplitted = targetTokenData.code.split('.');

      const baseTokenDataNamespace =
        baseTokenCodeSplitted.length > 1 ? baseTokenCodeSplitted[0] : null;
      const baseTokenDataName =
        baseTokenCodeSplitted.length > 1
          ? baseTokenCodeSplitted[1]
          : baseTokenCodeSplitted[0];

      const targetTokenDataNamespace =
        targetTokenCodeSplitted.length > 1 ? targetTokenCodeSplitted[0] : null;
      const targetTokenDataName =
        targetTokenCodeSplitted.length > 1
          ? targetTokenCodeSplitted[1]
          : targetTokenCodeSplitted[0];

      // filter volumes on both side foreach pair
      const pairVolumes = _.filter(volumes, (volume) => {
        return (
          (volume.tokenFromNamespace === baseTokenDataNamespace &&
            volume.tokenFromName === baseTokenDataName &&
            volume.tokenToNamespace === targetTokenDataNamespace &&
            volume.tokenToName === targetTokenDataName) ||
          (volume.tokenFromNamespace === targetTokenDataNamespace &&
            volume.tokenFromName === targetTokenDataName &&
            volume.tokenToNamespace === baseTokenDataNamespace &&
            volume.tokenToName === baseTokenDataName)
        );
      });

      let baseTokenVolume = 0;
      let targetTokenVolume = 0;

      pairVolumes.forEach((volume) => {
        if (
          volume.tokenFromNamespace === baseTokenDataNamespace &&
          volume.tokenFromName === baseTokenDataName
        ) {
          baseTokenVolume += volume.tokenFromVolume;
        }

        if (
          volume.tokenToNamespace === baseTokenDataNamespace &&
          volume.tokenToName === baseTokenDataName
        ) {
          baseTokenVolume += volume.tokenToVolume;
        }

        if (
          volume.tokenFromNamespace === targetTokenDataNamespace &&
          volume.tokenFromName === targetTokenDataName
        ) {
          targetTokenVolume += volume.tokenFromVolume;
        }

        if (
          volume.tokenToNamespace === targetTokenDataNamespace &&
          volume.tokenToName === targetTokenDataName
        ) {
          targetTokenVolume += volume.tokenToVolume;
        }
      });

      const liquidity = liquidities.find(
        (x) =>
          (x.tokenFrom === baseTokenData.code &&
            x.tokenTo === targetTokenData.code) ||
          (x.tokenFrom === targetTokenData.code &&
            x.tokenTo === baseTokenData.code),
      );

      let liquidityInUsd = 0;
      if (liquidity && liquidity.tokenFromTVL && liquidity.tokenToTVL) {
        liquidityInUsd =
          liquidity.tokenFrom === 'coin'
            ? liquidity.tokenFromTVL * kdaUsdPrice
            : liquidity.tokenToTVL * kdaUsdPrice;
      }

      const item: TickerDto = {
        pair: pair.pool_id,
        baseId: baseTokenData.code,
        baseName: baseTokenData.extendedName,
        baseSymbol: baseTokenData.name,
        quoteId: targetTokenData.code,
        quoteName: targetTokenData.extendedName,
        quoteSymbol: targetTokenData.name,
        baseVolume: baseTokenVolume,
        quoteVolume: targetTokenVolume,
        lastPrice: targetTokenVolume / baseTokenVolume,
        liquidityInUsd: liquidityInUsd * 2,
      };

      result.push(item);
    }

    return result;
  }

  private async computeTickersPairsDataNew(
    volumes: any,
    kdaUsdPrice: number,
  ): Promise<TickerDto[]> {
    const result: TickerDto[] = [];
    const pairs = this.getPairs();
    const liquidities = await this.connection
      .collection(LIQUIDITY_POOLS_COLLECTION_NAME)
      .find({
        chain: Number(this.CHAIN_ID),
      })
      .toArray();
    for (const pair of pairs) {
      let pairTokensCode = pair.pool_id.split(':');
      if (pairTokensCode[0] === 'coin') {
        pairTokensCode = pairTokensCode.reverse();
      }
      const baseTokenData = TOKENS[pairTokensCode[0]];
      const targetTokenData = TOKENS[pairTokensCode[1]];

      const baseTokenCodeSplitted = baseTokenData.code.split('.');
      const targetTokenCodeSplitted = targetTokenData.code.split('.');

      const baseTokenDataNamespace =
        baseTokenCodeSplitted.length > 1 ? baseTokenCodeSplitted[0] : null;
      const baseTokenDataName =
        baseTokenCodeSplitted.length > 1
          ? baseTokenCodeSplitted[1]
          : baseTokenCodeSplitted[0];

      const targetTokenDataNamespace =
        targetTokenCodeSplitted.length > 1 ? targetTokenCodeSplitted[0] : null;
      const targetTokenDataName =
        targetTokenCodeSplitted.length > 1
          ? targetTokenCodeSplitted[1]
          : targetTokenCodeSplitted[0];

      // filter volumes on both side foreach pair
      const pairVolumes = _.filter(volumes, (volume) => {
        return (
          (volume.tokenFromNamespace === baseTokenDataNamespace &&
            volume.tokenFromName === baseTokenDataName &&
            volume.tokenToNamespace === targetTokenDataNamespace &&
            volume.tokenToName === targetTokenDataName) ||
          (volume.tokenFromNamespace === targetTokenDataNamespace &&
            volume.tokenFromName === targetTokenDataName &&
            volume.tokenToNamespace === baseTokenDataNamespace &&
            volume.tokenToName === baseTokenDataName)
        );
      });

      let baseTokenVolume = 0;
      let targetTokenVolume = 0;

      pairVolumes.forEach((volume) => {
        if (
          volume.tokenFromNamespace === baseTokenDataNamespace &&
          volume.tokenFromName === baseTokenDataName
        ) {
          baseTokenVolume += volume.tokenFromVolume;
        }

        if (
          volume.tokenToNamespace === baseTokenDataNamespace &&
          volume.tokenToName === baseTokenDataName
        ) {
          baseTokenVolume += volume.tokenToVolume;
        }

        if (
          volume.tokenFromNamespace === targetTokenDataNamespace &&
          volume.tokenFromName === targetTokenDataName
        ) {
          targetTokenVolume += volume.tokenFromVolume;
        }

        if (
          volume.tokenToNamespace === targetTokenDataNamespace &&
          volume.tokenToName === targetTokenDataName
        ) {
          targetTokenVolume += volume.tokenToVolume;
        }
      });

      const liquidity = liquidities.find(
        (x) =>
          (x.tokenFrom === baseTokenData.code &&
            x.tokenTo === targetTokenData.code) ||
          (x.tokenFrom === targetTokenData.code &&
            x.tokenTo === baseTokenData.code),
      );

      let liquidityInUsd = 0;
      let lastPrice = 0;
      if (liquidity && liquidity.tokenFromTVL && liquidity.tokenToTVL) {
        liquidityInUsd =
          liquidity.tokenFrom === 'coin'
            ? liquidity.tokenFromTVL * kdaUsdPrice
            : liquidity.tokenToTVL * kdaUsdPrice;

        lastPrice =
          liquidity.tokenFrom === 'coin'
            ? liquidity.tokenFromTVL / liquidity.tokenToTVL
            : liquidity.tokenToTVL / liquidity.tokenFromTVL;
      }

      const item: TickerDto = {
        pair: pair.pool_id,
        baseId: baseTokenData.code,
        baseName: baseTokenData.extendedName,
        baseSymbol: baseTokenData.name,
        quoteId: targetTokenData.code,
        quoteName: targetTokenData.extendedName,
        quoteSymbol: targetTokenData.name,
        baseVolume: baseTokenVolume,
        quoteVolume: targetTokenVolume,
        lastPrice,
        liquidityInUsd: liquidityInUsd * 2,
      };

      result.push(item);
    }

    return result;
  }

  async getCGTickers(
    volumes: any,
    kdaUsdPrice: number,
  ): Promise<CoingeckoTickerDto[]> {
    const result: CoingeckoTickerDto[] = [];
    const computedPairsData = await this.computeTickersPairsDataNew(
      volumes,
      kdaUsdPrice,
    );
    computedPairsData.map((item) => {
      result.push({
        ticker_id: `${item.baseSymbol}_${item.quoteSymbol}`,
        base_currency: item.baseSymbol,
        target_currency: item.quoteSymbol,
        base_volume: item.baseVolume,
        target_volume: item.quoteVolume,
        last_price: item.lastPrice,
        pool_id: `${item.baseId}:${item.quoteId}`,
        liquidity_in_usd: item.liquidityInUsd,
      });
    });

    return result;
  }

  async getCMMTickers(
    volumes: any,
    kdaUsdPrice: number,
  ): Promise<CMMTickerResponseDto> {
    const result = new CMMTickerResponseDto();
    const computedPairsData = await this.computeTickersPairsData(
      volumes,
      kdaUsdPrice,
    );
    computedPairsData.map((item) => {
      result[`${item.baseId}_${item.quoteId}`] = {
        base_id: item.baseId,
        base_name: item.baseName,
        base_symbol: item.baseSymbol,
        quote_id: item.quoteId,
        quote_name: item.quoteName,
        quote_symbol: item.quoteSymbol,
        base_volume: item.baseVolume,
        quote_volume: item.quoteVolume,
        last_price: item.lastPrice,
      };
    });
    return result;
  }

  async getKDXCirculatingSupply() {
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(- (kaddex.kdx.total-supply) (+ (at 'burnt-kdx (kaddex.staking.get-pool-state)) (kaddex.kdx.get-balance 'kaddex-kdx-wrapper-mint-bank)))`,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;
      return extractDecimal(data);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getKDXTotalSupply(): Promise<number> {
    const MAX_SUPPLY = 1000000000.0;
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `
          (let* (
            (burned (fold (+) 0.0 (map (lambda (p) (at 'total-burned (kaddex.kdx.get-raw-supply p))) (kaddex.kdx.get-purpose-list))))
            (staking-burnt (at 'burnt-kdx (kaddex.staking.get-pool-state)))
           ){'burned:burned, 'staking-burnt:staking-burnt})
          `,
          meta: pact.lang.mkMeta(
            '',
            this.CHAIN_ID.toString(),
            0.0000001,
            150000,
            Math.round(new Date().getTime() / 1000) - 10,
            600,
          ),
        },
        this.URL,
      );
      const {
        result: { data },
      }: { result: { data: any } } = pactResponse;

      const tokenBurn = extractDecimal(data['burned']);
      const stakingBurn = extractDecimal(data['staking-burnt']);

      return MAX_SUPPLY - (tokenBurn + stakingBurn);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
