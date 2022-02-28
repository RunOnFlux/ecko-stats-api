import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DailyVolumesService } from './daily-volume.service';
import { AggregatedDailyVolumeDto } from './dto/aggregated-daily-volume.dto';

@Controller('daily-volume')
@ApiTags('Volume')
export class DailyVolumeController {
  constructor(private readonly dalyVolumeService: DailyVolumesService) {}

  @Get()
  @ApiOperation({ summary: `Get aggregated daily volume` })
  @ApiOkResponse({
    type: AggregatedDailyVolumeDto,
  })
  async findAll(
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dalyVolumeService.findAllAggregate(
      'kswap.exchange.SWAP',
      dateStart,
      dateEnd,
    );
  }
}
