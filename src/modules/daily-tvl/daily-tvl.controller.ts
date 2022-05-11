import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyTvlService } from './daily-tvl.service';
import { AggregatedDailyTVLDto } from './dto/aggregated-daily-tvl.dto';
import { TVL_COLLECTION_NAME } from './schemas/daily-tvl.schema';

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
      TVL_COLLECTION_NAME,
      dateStart,
      dateEnd,
    );
  }
}
