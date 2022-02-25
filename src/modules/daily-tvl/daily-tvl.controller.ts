import { Controller, Get, Query } from '@nestjs/common';
import { DailyTvlService } from './daily-tvl.service';

@Controller('daily-tvl')
export class DailyTvlController {
  constructor(private readonly dailyTvlService: DailyTvlService) {}

  @Get()
  async findAll(
    @Query('eventName') eventName: string,
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dailyTvlService.findAllAggregate(
      eventName,
      dateStart,
      dateEnd,
    );
  }
}
