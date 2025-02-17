import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as Pact from 'pact-lang-api';
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

    const chains = Array.from(Array(20).keys()); // [0..19]
    const fungibleTokens: string[][] = [];

    for (const chainId of chains) {
      let chainTokens = await this.getChainTokensBatch(chainId?.toString());
      if (!chainTokens) {
        this.logger.error(`Batch token fetching failed for chain ${chainId}`);
        chainTokens = await this.getChainTokens(chainId?.toString());
      }
      console.log(`CHAIN ${chainId} chainTokens:`, chainTokens.length);
      fungibleTokens.push(chainTokens);
    }

    const founded = await this.chainDataModel.findOneAndUpdate(
      {},
      { fungibleTokens },
    );

    if (!founded) {
      const chainData: ChainData = {
        fungibleTokens,
      };
      await this.chainDataModel.create(chainData);
    }
  }

  async getChainTokens(chainId: string): Promise<string[]> {
    try {
      const listModulesCode = '(list-modules)';
      const listModulesResponse = await Pact.fetch.local(
        {
          pactCode: listModulesCode,
          meta: Pact.lang.mkMeta(
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

      if (listModulesResponse?.result?.status === 'failure') {
        this.logger.error(
          `[CHAIN ${chainId}] Error calling list-modules: ${listModulesResponse?.result?.message}`,
        );
        return null;
      } else {
        this.logger.debug(
          `[CHAIN ${chainId}] Founded ${listModulesResponse?.result?.data?.length} modules`,
        );
      }

      if (listModulesResponse?.result?.status === 'success') {
        const modules = listModulesResponse?.result?.data as string[];

        const chainTokens: string[] = [];
        let moduleCount = 1;
        for (const mod of modules) {
          const describeModuleCode = `(describe-module "${mod}")`;
          try {
            this.logger.log(
              `[CHAIN ${chainId}] Checking module ${moduleCount}/${modules.length} ${mod} on chain ${chainId}`,
            );
            const describeModuleResponse = await Pact.fetch.local(
              {
                pactCode: describeModuleCode,
                meta: Pact.lang.mkMeta(
                  '',
                  chainId,
                  0.0000001,
                  15000000,
                  Math.round(new Date().getTime() / 1000) - 10,
                  600,
                ),
              },
              `${process.env.CHAINWEB_NODE_URL}/chainweb/0.0/${process.env.CHAINWEB_NETWORK_ID}/chain/${chainId}/pact`,
            );

            if (describeModuleResponse?.result?.status === 'success') {
              const descr = describeModuleResponse?.result?.data;
              const interfaces = descr.interfaces || descr.interface || [];

              if (interfaces.includes('fungible-v2')) {
                this.logger.log(
                  `[CHAIN ${chainId}] Found fungible token ${descr.name}`,
                );
                chainTokens.push(descr.name);
              } else {
                this.logger.debug(
                  `[CHAIN ${chainId}] MODULE NOT SUPPORTED! ${mod}: ${describeModuleResponse?.result?.error?.message}`,
                );
              }
            } else {
              this.logger.debug(
                `[CHAIN ${chainId}] MODULE NOT SUPPORTED! ${mod}: ${describeModuleResponse?.result?.error?.message}`,
              );
            }
          } catch (describeErr) {
            this.logger.debug(
              `[CHAIN ${chainId}] MODULE NOT SUPPORTED! ${mod}`,
            );
          }
          moduleCount++;
        }

        this.logger.log(
          `Fetch completed for chain ${chainId} (${chainTokens.length} fung-tokens)`,
        );

        return chainTokens;
      } else {
        this.logger.warn(`Unable to fetch modules for chain ${chainId}`);
        this.logger.warn(listModulesResponse?.result?.error?.message);
        return null;
      }
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async getChainTokensBatch(chainId: string): Promise<string[]> {
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
    try {
      const pactResponse = await Pact.fetch.local(
        {
          pactCode,
          meta: Pact.lang.mkMeta(
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
        return chainTokens;
      } else {
        this.logger.warn(`Unable to fetch for chain ${chainId}`);
        this.logger.warn(pactResponse?.result?.error?.message);
        return null;
      }
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }
}
