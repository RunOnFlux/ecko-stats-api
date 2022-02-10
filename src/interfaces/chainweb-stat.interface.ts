export interface IRef {
  namespace: string | null;
  name: string;
}

export interface IRefData {
  refSpec: IRef[];
  refName: IRef;
}

export interface IChainwebStat {
  blockTime: Date;
  height: number;
  blockHash: string;
  requestKey: string;
  params: [string, string, number, IRefData, number, IRefData];
  name: string;
  idx: number;
  chain: number;
  moduleHash: string;
}
