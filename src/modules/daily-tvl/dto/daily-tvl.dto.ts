import { ApiProperty } from '@nestjs/swagger';

export class DailyTVLDto {
  @ApiProperty()
  id?: any;

  @ApiProperty()
  day: Date;

  @ApiProperty()
  dayString: string;

  @ApiProperty()
  chain: number;

  @ApiProperty()
  tokenFrom: string;

  @ApiProperty()
  tokenTo: string;

  @ApiProperty()
  tokenFromTVL: number;

  @ApiProperty()
  tokenToTVL: number;
}
