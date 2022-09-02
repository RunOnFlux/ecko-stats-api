import { ApiProperty } from '@nestjs/swagger';

export interface TokenStatsResponseInterface {
  [key: string]: TokenStatsDto;
}

export class TokenStatsDto {
  @ApiProperty()
  priceChange24h: number;

  @ApiProperty()
  volume24h: number;

  @ApiProperty()
  volumeChange24h: number;
}

export class TokenStatsResponseDto implements TokenStatsResponseInterface {
  [key: string]: TokenStatsDto;
}
