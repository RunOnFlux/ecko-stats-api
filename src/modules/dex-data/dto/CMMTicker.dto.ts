import { ApiProperty } from '@nestjs/swagger';

export interface CMMTickerDtoInterface {
  [key: string]: CMMTickerDto;
}

export class CMMTickerDto {
  @ApiProperty()
  base_id: string;

  @ApiProperty()
  base_name: string;

  @ApiProperty()
  base_symbol: string;

  @ApiProperty()
  quote_id: string;

  @ApiProperty()
  quote_name: string;

  @ApiProperty()
  quote_symbol: string;

  @ApiProperty()
  last_price: number;

  @ApiProperty()
  base_volume: number;

  @ApiProperty()
  quote_volume: number;
}

export class CMMTickerResponseDto implements CMMTickerDtoInterface {
  [key: string]: CMMTickerDto;
}
