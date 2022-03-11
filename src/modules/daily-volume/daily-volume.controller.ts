import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DailyVolumesService } from './daily-volume.service';
import { AggregatedDailyVolumeDto } from './dto/aggregated-daily-volume.dto';

export enum VolumeAggregationEnum {
  day = 'day',
  week = 'week',
  month = 'month',
}

@Controller('daily-volume')
@ApiTags('Volume')
export class DailyVolumeController {
  constructor(private readonly dalyVolumeService: DailyVolumesService) {}

  @Get()
  @ApiOperation({ summary: `Get aggregated daily volume` })
  @ApiOkResponse({
    type: AggregatedDailyVolumeDto,
  })
  @ApiQuery({
    name: 'volumeAggregation',
    enum: VolumeAggregationEnum,
  })
  async findAll(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
    @Query('volumeAggregation') volumeAggregation: VolumeAggregationEnum,
  ) {
    switch (volumeAggregation) {
      case VolumeAggregationEnum.day: {
        return await this.dalyVolumeService.findAllAggregateByDay(
          'kswap.exchange.SWAP',
          dateStart,
          dateEnd,
        );
      }
      case VolumeAggregationEnum.week: {
        return await this.dalyVolumeService.findAllAggregateByWeek(
          'kswap.exchange.SWAP',
          dateStart,
          dateEnd,
        );
      }
      case VolumeAggregationEnum.month: {
        return await this.dalyVolumeService.findAllAggregateByMonth(
          'kswap.exchange.SWAP',
          dateStart,
          dateEnd,
        );
      }
    }
  }
}
