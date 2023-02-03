import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as pact from 'pact-lang-api';
import { BLACKLISTED_TOKENS, TOKENS } from 'src/data/tokens';
import { extractDecimal } from 'src/utils/pact-data.utils';
import { TokenData, TokenDataDocument } from './schemas/token-data.schema';
import { Pair, Token } from './types';

@Injectable()
export class TokenDataService {
  private readonly logger = new ConsoleLogger(TokenDataService.name);
  private readonly NETWORK_ID = process.env.CHAINWEB_NETWORK_ID;
  private readonly BASE_URL = process.env.CHAINWEB_NODE_URL;
  private readonly CHAIN_ID = process.env.CHAIN_ID;
  private readonly URL = `${this.BASE_URL}/chainweb/0.0/${this.NETWORK_ID}/chain/${this.CHAIN_ID}/pact`;
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

  async getPairs(): Promise<Pair[]> {
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(kaddex.exchange.get-pairs)`,
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
      }: { result: { data: string[] } } = pactResponse;

      const result: Pair[] = [];

      data.forEach((pairString) => {
        const tokenCodes = pairString.split(':');
        if (
          !BLACKLISTED_TOKENS.some(
            (x) => x === tokenCodes[0] || x === tokenCodes[1],
          )
        ) {
          const pairObject: Pair = {
            code: pairString,
            token1: getTokenObject(tokenCodes[0]),
            token2: getTokenObject(tokenCodes[1]),
          };
          result.push(pairObject);
        }
      });

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getTokens(): Promise<Token[]> {
    try {
      const pactResponse = await pact.fetch.local(
        {
          pactCode: `(kaddex.exchange.get-pairs)`,
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
      }: { result: { data: string[] } } = pactResponse;

      const result: Token[] = [];

      data.forEach((pairString) => {
        const tokenCodes = pairString.split(':');
        const token1 = tokenCodes[0];
        const token2 = tokenCodes[1];

        if (
          !result.some((x) => x.code === token1) &&
          !BLACKLISTED_TOKENS.some((x) => x === token1)
        ) {
          result.push(getTokenObject(token1));
        }
        if (
          !result.some((x) => x.code === token2) &&
          !BLACKLISTED_TOKENS.some((x) => x === token2)
        ) {
          result.push(getTokenObject(token2));
        }
      });

      return result;
    } catch (error) {
      throw new Error(error);
    }
  }
}

function getTokenObject(tokenCode: string): Token {
  const verifiedToken = TOKENS[tokenCode];
  if (verifiedToken) {
    return {
      code: tokenCode,
      logoUrl: verifiedToken.logoURL,
      name: verifiedToken.extendedName,
      symbol: verifiedToken.name,
    };
  } else {
    return {
      code: tokenCode,
      logoUrl: null,
      name: null,
      symbol: null,
    };
  }
}
