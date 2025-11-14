import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { lastValueFrom, map } from 'rxjs';
import {
  GetCandlesParams,
  GetCandlesResponse,
  GateioRawCandle,
} from './interfaces/gateio.interfaces';

export const GATEIO_ENDPOINT = 'https://api.gateio.ws/api/v4';

@Injectable()
export class GateioService {
  constructor(private readonly httpService: HttpService) {}

  async getCandles({
    currency_pair,
    from,
    to,
    interval,
  }: GetCandlesParams): Promise<GetCandlesResponse[]> {
    const candlesResponse = await this.httpService
      .get(`${GATEIO_ENDPOINT}/spot/candlesticks`, {
        params: {
          currency_pair,
          from,
          to,
          interval,
        },
      })
      .pipe(map((response) => response.data));

    const candles: GateioRawCandle[] = await lastValueFrom(candlesResponse);

    if (candles && Array.isArray(candles)) {
      return candles.map(
        ([timestamp, volume, close, high, low, open, amount, isClosed]) => ({
          timeString: moment.unix(Number(timestamp)).format('YYYY-MM-DD'),
          time: Number(timestamp),
          open: Number(open),
          close: Number(close),
          high: Number(high),
          low: Number(low),
          volume: Number(volume),
          turnover: Number(amount),
        }),
      );
    }
    return null;
  }
}

