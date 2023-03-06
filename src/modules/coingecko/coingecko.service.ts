import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { lastValueFrom } from 'rxjs';
import { GetKdaUsdResponse } from './interfaces';

@Injectable()
export class CoingeckoService {
  private readonly logger = new ConsoleLogger(CoingeckoService.name);
  private readonly BASE_URL = `https://api.coingecko.com/api/v3`;
  constructor(private readonly httpService: HttpService) {}

  async getKdaUsdPrice(): Promise<number> {
    const endpoint = `simple/price?ids=kadena&vs_currencies=usd`;
    const request = this.httpService.get(`${this.BASE_URL}/${endpoint}`);
    const result = await lastValueFrom(request);
    if (result.status === 200) {
      const { data }: { data: GetKdaUsdResponse } = result;
      return data.kadena.usd;
    } else {
      this.logger.error(result);
      return 0;
    }
  }
}
