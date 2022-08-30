import { ApiProperty } from '@nestjs/swagger';

export class PairDto {
  @ApiProperty()
  ticker_id: string;

  @ApiProperty()
  base: string;

  @ApiProperty()
  target: string;

  @ApiProperty()
  pool_id: string;
}
