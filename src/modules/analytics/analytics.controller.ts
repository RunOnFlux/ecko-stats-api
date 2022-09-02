import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DailyVolumesService } from '../daily-volume/daily-volume.service';
import { DexDataService } from '../dex-data/dex-data.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDto } from './dto/analytics.dto';
import { TokenStatsResponseDto } from './dto/token-stats-response.dto';
import * as moment from 'moment';
import { TokenCandlesService } from '../token-candles/token-candles.service';
import { asyncForEach } from 'src/utils/array.utils';
import { getPercentage } from 'src/utils/math.utils';

@Controller('analytics')
@ApiTags('Analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dailyVolumeService: DailyVolumesService,
    private readonly dexDataService: DexDataService,
    private readonly tokenCandlesService: TokenCandlesService,
  ) {}

  @Get('get-data')
  @ApiOperation({ summary: `Get analytics data` })
  @ApiOkResponse({
    type: AnalyticsDto,
  })
  @ApiQuery({ name: 'dateStart', type: Date, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateEnd', type: Date, description: 'YYYY-MM-DD' })
  async getData(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.analyticsService.getData(dateStart, dateEnd);
  }

  @Get('get-token-stats')
  @ApiOperation({ summary: `Get analytics token stats` })
  @ApiOkResponse({
    type: TokenStatsResponseDto,
  })
  async getTokenStats() {
    const currentVolume24 = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
    );

    const initialDailyVolumes = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().subtract(2, 'days').format('YYYY-MM-DD'),
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
    );

    const finalDailyVolumes = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    );

    const tickersCurrentVolume24 =
      this.dexDataService.getCGTickers(currentVolume24);
    const tickersInitialDailyVolume =
      this.dexDataService.getCGTickers(initialDailyVolumes);
    const tickersFinalDailyVolume =
      this.dexDataService.getCGTickers(finalDailyVolumes);

    const tokensVolumesStats = await this.analyticsService.getTokenStats(
      tickersCurrentVolume24,
      tickersInitialDailyVolume,
      tickersFinalDailyVolume,
    );

    await asyncForEach(Object.keys(tokensVolumesStats), async (item) => {
      const asset = item === 'coin' ? 'KDA' : item;
      const currency = item === 'coin' ? 'USDT' : 'coin';
      const candles = await this.tokenCandlesService.findAll(
        `${asset}/${currency}`,
        moment().subtract(1, 'days').format('YYYY-MM-DD'),
        moment().format('YYYY-MM-DD'),
      );
      const prices = candles?.length
        ? {
            initial: candles[0]?.price?.close,
            final: candles[candles.length - 1]?.price?.close,
          }
        : null;
      if (prices && prices.initial && prices.final) {
        tokensVolumesStats[item].priceChange24h = getPercentage(
          prices.initial,
          prices.final,
        );
      } else {
        tokensVolumesStats[item].priceChange24h = 0;
      }
    });

    return tokensVolumesStats;
  }
}
