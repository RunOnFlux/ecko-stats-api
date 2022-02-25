export interface IRef {
  namespace: string | null;
  name: string;
}

export interface IRefData {
  refSpec: IRef[];
  refName: IRef;
}

export interface ITokenBalanceDecimal {
  decimal: string;
}

export interface IKSwapExchangeSWAP {
  blockTime: Date;
  height: number;
  blockHash: string;
  requestKey: string;
  params: [
    string,
    string,
    number | ITokenBalanceDecimal,
    IRefData,
    number,
    IRefData,
  ];
  name: string;
  idx: number;
  chain: number;
  moduleHash: string;
}
