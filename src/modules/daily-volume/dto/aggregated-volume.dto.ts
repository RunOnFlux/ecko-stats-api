import { ApiProperty } from '@nestjs/swagger';
import { DailyVolumeDto } from './daily-volume.dto';
import { MonthlyVolumeDto } from './monthly-volume.dto';
import { WeeklyVolumeDto } from './weekly-volume.dto';

export class AggregatedDailyVolumeDto {
  @ApiProperty()
  _id: Date;

  @ApiProperty({ type: [DailyVolumeDto] })
  volumes: DailyVolumeDto[];
}

export class AggregatedWeeklyVolumeDto {
  @ApiProperty()
  _id: Date;

  @ApiProperty({ type: [WeeklyVolumeDto] })
  volumes: WeeklyVolumeDto[];
}

export class AggregatedMonthlyVolumeDto {
  @ApiProperty()
  _id: Date;

  @ApiProperty({ type: [MonthlyVolumeDto] })
  volumes: MonthlyVolumeDto[];
}
