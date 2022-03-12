import { ApiProperty } from '@nestjs/swagger';
import { DailyTVLDto } from './daily-tvl.dto';

export class AggregatedDailyTVLDto {
  @ApiProperty()
  _id: Date;

  @ApiProperty({ type: [DailyTVLDto] })
  tvl: DailyTVLDto[];
}
