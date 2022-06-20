import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { lastValueFrom, map } from 'rxjs';
import {
  GetCandlesParams,
  GetCandlesResponse,
  KucoinResponse,
} from './interfaces/kucoin.interfaces';

export const KUCOIN_ENPOINT = 'https://api.kucoin.com/api/v1';

@Injectable()
export class KucoinService {
  constructor(private readonly httpService: HttpService) {}

  async getCandles({
    symbol,
    startAt,
    endAt,
    type,
  }: GetCandlesParams): Promise<GetCandlesResponse[]> {
    const candlesResponse = await this.httpService
      .get(`${KUCOIN_ENPOINT}/market/candles`, {
        params: {
          symbol,
          startAt,
          endAt,
          type,
        },
      })
      .pipe(map((response) => response.data));
    const candles: KucoinResponse<string[]> = await lastValueFrom(
      candlesResponse,
    );
    if (candles.code === '200000') {
      return candles.data.map(
        ([time, open, close, high, low, volume, turnover]) => ({
          timeString: moment.unix(Number(time)).format('YYYY-MM-DD'),
          time: Number(time),
          open: Number(open),
          close: Number(close),
          high: Number(high),
          low: Number(low),
          volume: Number(volume),
          turnover: Number(turnover),
        }),
      );
    }
    return null;
  }
}
