import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async getData() {
    return await this.analyticsService.getData();
  }
}
