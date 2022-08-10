import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDto } from './dto/analytics.dto';

@Controller('analytics')
@ApiTags('Analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

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
}
