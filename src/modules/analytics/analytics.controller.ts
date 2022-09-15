import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DailyVolumesService } from '../daily-volume/daily-volume.service';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDto } from './dto/analytics.dto';
import { TokenStatsResponseDto } from './dto/token-stats-response.dto';
import * as moment from 'moment';
import { TokenCandlesService } from '../token-candles/token-candles.service';
import { asyncForEach } from 'src/utils/array.utils';
import { getPercentage } from 'src/utils/math.utils';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { DailyTvlService } from '../daily-tvl/daily-tvl.service';
import { TVL_COLLECTION_NAME } from '../daily-tvl/schemas/daily-tvl.schema';

@Controller('analytics')
@ApiTags('Analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly dailyVolumeService: DailyVolumesService,
    private readonly tokenCandlesService: TokenCandlesService,
    private readonly httpService: HttpService,
    private readonly dailyTvlService: DailyTvlService,
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

    const pairsFromExchange =
      await this.analyticsService.getPairsFromExchange();

    const aggregatedCurrentVolume24 =
      this.analyticsService.getAggregatedPairVolumes(
        currentVolume24,
        pairsFromExchange,
      );
    const aggregatedInitialDailyVolume =
      this.analyticsService.getAggregatedPairVolumes(
        initialDailyVolumes,
        pairsFromExchange,
      );
    const aggregatedFinalDailyVolume =
      this.analyticsService.getAggregatedPairVolumes(
        finalDailyVolumes,
        pairsFromExchange,
      );

    const tokensVolumesStats = await this.analyticsService.getTokenStats(
      aggregatedCurrentVolume24,
      aggregatedInitialDailyVolume,
      aggregatedFinalDailyVolume,
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
            initial:
              asset === 'KDA'
                ? candles[0]?.price?.close
                : candles[0]?.usdPrice?.close,
            final:
              asset === 'KDA'
                ? candles[candles.length - 1]?.price?.close
                : candles[candles.length - 1]?.usdPrice?.close,
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

  @Get('get-pools-stats')
  @ApiOperation({ summary: `Get analytics pools stats` })
  async getPoolsStats() {
    const pairsFromExchange =
      await this.analyticsService.getPairsFromExchange();

    const volumes24h = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
    );

    const aggregatedVolumes24h = this.analyticsService.getAggregatedPairVolumes(
      volumes24h,
      pairsFromExchange,
    );

    return aggregatedVolumes24h;
  }
}
