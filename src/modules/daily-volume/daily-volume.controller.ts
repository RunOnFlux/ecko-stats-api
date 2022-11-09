import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DailyVolumesService } from './daily-volume.service';
import {
  AggregatedDailyVolumeDto,
  AggregatedMonthlyVolumeDto,
  AggregatedWeeklyVolumeDto,
} from './dto/aggregated-volume.dto';

@Controller('volume')
@ApiTags('Volume')
export class DailyVolumeController {
  constructor(private readonly dailyVolumeService: DailyVolumesService) {}

  @Get('daily')
  @ApiOperation({ summary: `Get aggregated daily volume` })
  @ApiOkResponse({
    type: AggregatedDailyVolumeDto,
  })
  @ApiQuery({ name: 'dateStart', type: Date, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateEnd', type: Date, description: 'YYYY-MM-DD' })
  async dailyVolume(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dailyVolumeService.findAllAggregateByDay(
      'kswap.exchange.SWAP',
      dateStart,
      dateEnd,
    );
  }

  @Get('weekly')
  @ApiOperation({ summary: `Get aggregated weekly volume` })
  @ApiOkResponse({
    type: AggregatedWeeklyVolumeDto,
  })
  @ApiQuery({ name: 'dateStart', type: Date, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateEnd', type: Date, description: 'YYYY-MM-DD' })
  async weeklyVolume(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dailyVolumeService.findAllAggregateByWeek(
      'kswap.exchange.SWAP',
      dateStart,
      dateEnd,
    );
  }

  @Get('monthly')
  @ApiOperation({ summary: `Get aggregated monthly volume` })
  @ApiOkResponse({
    type: AggregatedMonthlyVolumeDto,
  })
  @ApiQuery({ name: 'dateStart', type: Date, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateEnd', type: Date, description: 'YYYY-MM-DD' })
  async monthlyVolume(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dailyVolumeService.findAllAggregateByMonth(
      'kswap.exchange.SWAP',
      dateStart,
      dateEnd,
    );
  }
}
