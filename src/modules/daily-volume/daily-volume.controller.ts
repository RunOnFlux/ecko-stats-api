import { Controller, Get, Query } from '@nestjs/common';
import { DailyVolumesService } from './daily-volume.service';

@Controller('daily-volume')
export class DailyVolumeController {
  constructor(private readonly dalyVolumeService: DailyVolumesService) {}

  @Get()
  async findAll(
    @Query('eventName') eventName: string,
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.dalyVolumeService.findAllAggregate(
      eventName,
      dateStart,
      dateEnd,
    );
  }
}
