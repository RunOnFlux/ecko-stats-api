import { ApiProperty } from '@nestjs/swagger';

export class CoingeckoTickerDto {
  @ApiProperty()
  ticker_id: string;

  @ApiProperty()
  base_currency: string;

  @ApiProperty()
  target_currency: string;

  @ApiProperty()
  last_price: number;

  @ApiProperty()
  base_volume: number;

  @ApiProperty()
  target_volume: number;

  @ApiProperty()
  pool_id: string;

  @ApiProperty()
  liquidity_in_usd: number;
}
