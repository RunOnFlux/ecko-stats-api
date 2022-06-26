import { ApiProperty } from '@nestjs/swagger';

export class TokenCandleDto {
  @ApiProperty()
  id?: any;

  @ApiProperty()
  day: Date;

  @ApiProperty()
  dayString: string;

  @ApiProperty()
  chain: number;

  @ApiProperty()
  pairName: string;

  @ApiProperty()
  open: number;

  @ApiProperty()
  close: number;

  @ApiProperty()
  high: number;

  @ApiProperty()
  low: number;

  @ApiProperty()
  volume: number;
}
