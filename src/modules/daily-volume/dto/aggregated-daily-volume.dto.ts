import { ApiProperty } from '@nestjs/swagger';
import { DailyVolumeDto } from './daily-volume.dto';

export class AggregatedDailyVolumeDto {
  @ApiProperty()
  _id: Date;

  @ApiProperty({ type: [DailyVolumeDto] })
  volumes: DailyVolumeDto[];
}
