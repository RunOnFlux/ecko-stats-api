export interface GetCandlesParams {
  symbol: string;
  startAt: number;
  endAt: number;
  type:
    | '1min'
    | '3min'
    | '5min'
    | '15min'
    | '30min'
    | '1hour'
    | '2hour'
    | '4hour'
    | '6hour'
    | '8hour'
    | '12hour'
    | '1day'
    | '1week';
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

export interface KucoinResponse<T> {
  code: string;
  data: T[];
}
