import { ApiProperty } from '@nestjs/swagger';
import { VolumeDto } from './volume.dto';

export class DailyVolumeDto extends VolumeDto {
  @ApiProperty()
  day: Date;

  @ApiProperty()
  dayString: string;

  @ApiProperty()
  chain: number;
}
