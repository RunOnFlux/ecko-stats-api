import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import { extractDecimal } from 'src/utils/pact-data.utils';
import { TokenData, TokenDataDocument } from './schemas/token-data.schema';

@Injectable()
export class TokenDataService {
  private readonly logger = new ConsoleLogger(TokenDataService.name);

  constructor(
    @InjectModel(TokenData.name)
    private tokenDataModel: Model<TokenDataDocument>,
  ) {}

  async handleTokenData(
    tokenId: string,
    tokenTableName: string,
    balanceFieldName: string,
    liquidityHolderAccounts: string[],
  ) {
    this.logger.log(`START ${tokenId} DATA IMPORT`);

    const normalizedLiquidityHolderAccounts = liquidityHolderAccounts
      .map((i) => `"${i}"`)
      .join(',');

    const pactCode = `
    (let* (
        (total-supply (fold (+) 0.0 (fold-db ${tokenId}.${tokenTableName} (lambda (key row)   true) (lambda (key row) (at '${balanceFieldName} row)))))
        (locked-supply (fold (+) 0.0 (map (lambda (acc) (try 0.0 (at '${balanceFieldName} (read ${tokenId}.${tokenTableName} acc ['${balanceFieldName}])))) [${normalizedLiquidityHolderAccounts}])))
      )
        {'total-supply: total-supply, 'circulating-supply: (- total-supply locked-supply)}
    )
    `;

    const chains = Array.from(Array(20).keys());
    let totalSupply: number = 0;
    let circulatingSupply: number = 0;
    for (const chainId of chains) {
      try {
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
          `${process.env.CHAINWEB_NODE_URL}/chainweb/0.0/${process.env.CHAINWEB_NETWORK_ID}/chain/${chainId}/pact`,
        );
        if (pactResponse?.result?.status === 'success') {
          const toNormalizeTotalSupply: number =
            pactResponse?.result?.data?.['total-supply'];
          const toNormalizeCirculatingSupply: number =
            pactResponse?.result?.data?.['circulating-supply'];
          const totalSupplyToAdd: number = extractDecimal(
            toNormalizeTotalSupply,
          );
          const circulatingSupplyToAdd: number = extractDecimal(
            toNormalizeCirculatingSupply,
          );
          totalSupply += totalSupplyToAdd;
          circulatingSupply += circulatingSupplyToAdd;
          this.logger.log(
            `Chain ${chainId} success - totalSupply: ${totalSupplyToAdd} | circulatingSupply: ${circulatingSupplyToAdd}`,
          );
        } else {
          this.logger.warn(`Unable to fetch for chain ${chainId}`);
        }
      } catch (error) {
        this.logger.error(error);
      }
    }

    const filter = { tokenId };
    const update = { totalSupply, circulatingSupply, updatedAt: new Date() };

    const founded = await this.tokenDataModel.findOneAndUpdate(filter, update);

    if (!founded) {
      const tokenData: TokenData = {
        tokenId,
        circulatingSupply,
        totalSupply,
        updatedAt: new Date(),
      };
      await this.tokenDataModel.create(tokenData);
    }

    this.logger.log(
      `END ${tokenId} DATA IMPORT - TotalSupply: ${totalSupply} | circulatingSupply: ${circulatingSupply}`,
    );
  }

  async getTokenData(tokenId: String) {
    return await this.tokenDataModel.find({ tokenId }).exec();
  }
}
