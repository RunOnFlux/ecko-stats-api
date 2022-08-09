import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsDto {
  @ApiProperty()
  id?: any;

  @ApiProperty()
  lastUpdate: Date;

  @ApiProperty()
  chain: number;

  @ApiProperty()
  circulatingSupply: number;

  @ApiProperty()
  burned: number;

  @ApiProperty()
  daoTreasury: number;

  @ApiProperty()
  liquidityMining: number;
}
