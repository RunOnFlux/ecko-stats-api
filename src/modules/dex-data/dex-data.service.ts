import { ConsoleLogger, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import * as pact from 'pact-lang-api';
import { PAIR_TOKENS, TOKENS } from 'src/data/tokens';
import { extractDecimal } from 'src/utils/pact-data.utils';
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

  getTickers(dailyVolumes: any): TickerDto[] {
    const result: TickerDto[] = [];
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
      const pairVolumes = _.filter(dailyVolumes[0].volumes, (volume) => {
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

      result.push({
        ticker_id: `${baseTokenData.name}_${targetTokenData.name}`,
        base_currency: baseTokenData.name,
        target_currency: targetTokenData.name,
        base_volume: baseTokenVolume,
        target_volume: targetTokenVolume,
        last_price: baseTokenVolume / targetTokenVolume,
        pool_id: x.pool_id,
      });
    });

    return result;
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
