import { IRefData } from 'src/interfaces/kswap.exchange.SWAP.interface';
import * as pact from 'pact-lang-api';
import { PAIR_TOKENS } from 'src/data/tokens';
import { IKaddexTokenSupply } from 'src/interfaces/kaddex-token-supply.interface';

export const getApiBalance = (apiBalance) => {
  let balance = 0;
  if (typeof apiBalance === 'number') {
    balance = apiBalance;
  } else if (apiBalance?.decimal && !Number.isNaN(apiBalance?.decimal)) {
    balance = Number(apiBalance?.decimal);
  }
  return balance;
};

export const CHAINWEB_ESTATS_URL = 'https://estats.chainweb.com/txs/events';

export const isKdaCoin = (refData: IRefData): boolean => {
  return refData.refName.namespace === null && refData.refName.name === 'coin';
};

export const pactFetchLocal = async (chainId: number, pactCode: string) => {
  const networkId = process.env.CHAINWEB_NETWORK_ID;
  const url = `${process.env.CHAINWEB_NODE_URL}/chainweb/0.0/${networkId}/chain/${chainId}/pact`;
  return await pact.fetch.local(
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
};

export const getPairsTVL = async (
  chainId: number,
): Promise<IKaddexTokenSupply[]> => {
  const pairList = await Promise.all(
    Object.values(PAIR_TOKENS).map(
      async (pair): Promise<IKaddexTokenSupply> => {
        const pactCode = `
      (use kaddex.exchange)
      (let*
        (
          (p (get-pair ${pair.token0.code} ${pair.token1.code}))
          (reserveA (reserve-for p ${pair.token0.code}))
          (reserveB (reserve-for p ${pair.token1.code}))
          (totalBal (kaddex.tokens.total-supply (kaddex.exchange.get-pair-key ${pair.token0.code} ${pair.token1.code})))
        )[totalBal reserveA reserveB])
       `;
        const data = await pactFetchLocal(chainId, pactCode);
        return {
          tokenFrom: pair.token0.code,
          tokenTo: pair.token1.code,
          tokenFromTVL: getApiBalance(data.result.data[1]),
          tokenToTVL: getApiBalance(data.result.data[2]),
        };
      },
    ),
  );
  return pairList;
};
