export interface GetCandlesParams {
  currency_pair: string;
  from: number;
  to: number;
  interval:
    | '10s'
    | '1m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '4h'
    | '8h'
    | '1d'
    | '7d'
    | '30d';
}

export interface GetCandlesResponse {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  timeString?: string;
}

export type GateioRawCandle = [
  timestamp: string,
  volume: string,
  close: string,
  high: string,
  low: string,
  open: string,
  amount: string,
  isClosed: string,
];

