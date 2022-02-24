export interface IRef {
  namespace: string | null;
  name: string;
}

export interface IDecimalData {
  decimal: string;
}

export interface IKSwapExchangeUPDATE {
  blockTime: Date;
  height: number;
  blockHash: string;
  requestKey: string;
  params: [string, IDecimalData, number];
  name: string;
  idx: number;
  chain: number;
  moduleHash: string;
}
