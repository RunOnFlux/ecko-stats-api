import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import { ChainData, ChainDataDocument } from './schemas/chain-data.schema';
import { whiteListedTokens } from './fixture/tokens';

@Injectable()
export class ChainDataService {
  private readonly logger = new ConsoleLogger(ChainDataService.name);

  constructor(
    @InjectModel(ChainData.name)
    private chainDataModel: Model<ChainDataDocument>,
  ) {}

  async getChainData() {
    const data = await this.chainDataModel.find({}, { _id: 0 });
    if (
      !data[0] ||
      !data[0].fungibleTokens?.length ||
      !data[0].fungibleTokens[0]?.length
    ) {
      return whiteListedTokens;
    }
    return data;
  }

  async fetchChainsFungibleTokens() {
    this.logger.log('START CHAIN FUNGIBLE TOKENS IMPORT');
    const pactCode = `(let
        ((all-tokens
           (lambda (contract:object)
             (let*
               ((module-name (at 'name contract))
                (interfaces (if (contains 'interfaces contract) (at 'interfaces contract) (if (contains 'interface contract) (at 'interface contract) [])))
                (is-implementing-fungible-v2 (contains "fungible-v2" interfaces))
               )
             (if is-implementing-fungible-v2 module-name "")
             )
           )
         )
        )
        (filter (!= "") (map (all-tokens) (map (describe-module) (list-modules))))
      )`;
    const chains = Array.from(Array(20).keys());
    const fungibleTokens: string[][] = [];
    for (const chainId of chains) {
      try {
        const pactResponse = await pact.fetch.local(
          {
            pactCode,
            meta: pact.lang.mkMeta(
              '',
              chainId.toString(),
              0.0000001,
              15000000,
              Math.round(new Date().getTime() / 1000) - 10,
              600,
            ),
          },
          `${process.env.CHAINWEB_NODE_URL}/chainweb/0.0/${process.env.CHAINWEB_NETWORK_ID}/chain/${chainId}/pact`,
        );
        if (pactResponse?.result?.status === 'success') {
          const chainTokens: string[] = pactResponse?.result?.data;
          this.logger.log(
            `Fetch completed for chain ${chainId} (${chainTokens?.length} fung-tokens)`,
          );
          fungibleTokens.push(chainTokens);
        } else {
          this.logger.warn(`Unable to fetch for chain ${chainId}`);
          this.logger.warn(pactResponse?.result?.error?.message);
          fungibleTokens.push([]);
        }
      } catch (error) {
        this.logger.error(error);
        fungibleTokens.push([]);
      }
    }
    const founded = await this.chainDataModel.findOneAndUpdate(
      {},
      {
        fungibleTokens,
      },
    );

    if (!founded) {
      const chainData: ChainData = {
        fungibleTokens,
      };
      await this.chainDataModel.create(chainData);
    }
  }
}
