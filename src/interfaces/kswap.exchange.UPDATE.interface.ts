import { ITokenBalanceDecimal } from './kswap.exchange.SWAP.interface';

export interface IRef {
  namespace: string | null;
  name: string;
}

export interface IKSwapExchangeUPDATE {
  blockTime: Date;
  height: number;
  blockHash: string;
  requestKey: string;
  params: [string, ITokenBalanceDecimal, number];
  name: string;
  idx: number;
  chain: number;
  moduleHash: string;
}
