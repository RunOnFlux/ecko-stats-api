import { ApiProperty } from '@nestjs/swagger';
import { VolumeDto } from './volume.dto';

export class WeeklyVolumeDto extends VolumeDto {
  @ApiProperty()
  startDay: Date;

  @ApiProperty()
  year: string;

  @ApiProperty()
  week: string;
}
