import { IRefData } from 'src/interfaces/kswap.exchange.SWAP.interface';

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
