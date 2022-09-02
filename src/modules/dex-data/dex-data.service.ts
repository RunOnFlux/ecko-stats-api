import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import * as pact from 'pact-lang-api';
import { PAIR_TOKENS, TOKENS } from 'src/data/tokens';
import { extractDecimal } from 'src/utils/pact-data.utils';
import { CMMTickerResponseDto } from './dto/CMMTicker.dto';
import { PairDto } from './dto/pair.dto';
import { TickerDto } from './dto/ticker.dto';

@Injectable()
export class DexDataService {
  private readonly logger = new ConsoleLogger(DexDataService.name);
  private readonly NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly BASE_URL = process.env.CHAINWEB_NODE_URL;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly URL = `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/${this.CHAIN_ID}/pact`;

  constructor() {}

  getPairs(): PairDto[] {
    const result: PairDto[] = Object.values(PAIR_TOKENS).map((x) => ({
      ticker_id: `${x.token0.name}_${x.token1.name}`,
      base: x.token0.name,
      target: x.token1.name,
      pool_id: x.name,
    }));
    return result;
  }

  private computeTickersPairsData(volumes: any): CMMTickerResponseDto {
    const result = new CMMTickerResponseDto();
    const pairs = this.getPairs();
    pairs.forEach((x) => {
      const pairTokensCode = x.pool_id.split(':');
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

      result[`${baseTokenData.code}_${targetTokenData.code}`] = {
        base_id: baseTokenData.code,
        base_name: baseTokenData.extendedName,
        base_symbol: baseTokenData.name,
        quote_id: targetTokenData.code,
        quote_name: targetTokenData.extendedName,
        quote_symbol: targetTokenData.name,
        base_volume: baseTokenVolume,
        quote_volume: targetTokenVolume,
        last_price: baseTokenVolume / targetTokenVolume,
      };
    });

    return result;
  }

  getCGTickers(volumes: any): TickerDto[] {
    const result: TickerDto[] = [];
    const computedPairsData = this.computeTickersPairsData(volumes);
    Object.keys(computedPairsData).forEach((key) => {
      result.push({
        ticker_id: `${computedPairsData[key].base_symbol}_${computedPairsData[key].quote_symbol}`,
        base_currency: computedPairsData[key].base_symbol,
        target_currency: computedPairsData[key].quote_symbol,
        base_volume: computedPairsData[key].base_volume,
        target_volume: computedPairsData[key].quote_volume,
        last_price: computedPairsData[key].last_price,
        pool_id: `${computedPairsData[key].base_id}:${computedPairsData[key].quote_id}`,
      });
    });

    return result;
  }

  getCMMTickers(volumes: any): CMMTickerResponseDto {
    return this.computeTickersPairsData(volumes);
  }

  async getKDXCirculatingSupply() {
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(- (kaddex.kdx.total-supply) (+ (at 'total-minted (kaddex.kdx.get-raw-supply 'network-rewards)) 
                     (- (at 'total-minted (kaddex.kdx.get-raw-supply 'network-rewards)) (kaddex.kdx.get-balance 'kaddex-kdx-wrapper-mint-bank))))`,
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
}
