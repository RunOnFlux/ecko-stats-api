import { ApiProperty } from '@nestjs/swagger';
import { VolumeDto } from './volume.dto';

export class MonthlyVolumeDto extends VolumeDto {
  @ApiProperty()
  startDay: Date;

  @ApiProperty()
  year: string;

  @ApiProperty()
  month: string;
}
