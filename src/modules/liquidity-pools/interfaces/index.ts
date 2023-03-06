export interface GetPoolLiquidityResponse {
  reserve0: Decimal | number;
  reserve1: Decimal | number;
  token1: Token;
  token0: Token;
  totalSupply: Decimal | number;
}

export interface Decimal {
  decimal: string;
}

export interface Token {
  refSpec: Ref[];
  refName: Ref;
}

export interface Ref {
  namespace: null | string;
  name: string;
}
