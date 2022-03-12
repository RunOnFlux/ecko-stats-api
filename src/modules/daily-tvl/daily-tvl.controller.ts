import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyTvlService } from './daily-tvl.service';
import { AggregatedDailyTVLDto } from './dto/aggregated-daily-tvl.dto';

@Controller('tvl')
@ApiTags('TVL')
export class DailyTvlController {
  constructor(private readonly dailyTvlService: DailyTvlService) {}

  @Get('daily')
  @ApiOperation({ summary: `Get aggregated Total value locked data` })
  @ApiOkResponse({
    type: AggregatedDailyTVLDto,
  })
  async findAll(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dailyTvlService.findAllAggregate(
      'kswap.exchange.UPDATE',
      dateStart,
      dateEnd,
    );
  }
}
