import { HttpService } from '@nestjs/axios';
import { Controller, Get } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { AppService } from './app.service';
import { DailyVolumesService } from './modules/daily-volume/daily-volume.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dailyVS: DailyVolumesService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('stats')
  async stats(): Promise<any> {
    // Request URL: https://estats.chainweb.com/txs/events?search=kswap.exchange.swap&offset=0&limit=20
    return await this.appService.stats('kswap.exchange.SWAP', 10, 0);
  }

  @Get('stats-import')
  async statsImport(): Promise<any> {
    return await this.appService.statsImport('kswap.exchange.SWAP');
  }

  @Get('test')
  async test(): Promise<any> {
    return await this.dailyVS.create('kswap.exchange.SWAP', {
      day: new Date(),
      chain: 2,
      tokenFromName: 'coin',
      tokenFromNamespace: null,
      tokenFromVolume: 1002,
      tokenToName: 'flux',
      tokenToNamespace: 'runonflux',
      tokenToVolume: 165.6,
    });
  }
}
