import { ITokenBalanceDecimal } from './kswap.exchange.SWAP.interface';

export interface IKaddexStakingPoolState {
  'revenue-per-kdx': number | ITokenBalanceDecimal;
  'burnt-kdx': number | ITokenBalanceDecimal;
  'staked-kdx': number | ITokenBalanceDecimal;
}
