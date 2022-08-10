import { ApiProperty } from '@nestjs/swagger';

export class CirculatingSupplyDto {
  @ApiProperty()
  totalSupply: number;

  @ApiProperty()
  lockedAmount: number;

  @ApiProperty()
  stakedAmount: number;
}

export class BurnDto {
  @ApiProperty()
  tokenBurn: number;

  @ApiProperty()
  stakingBurn: number;
}

export class LiquidityProvidingPositionDto {
  @ApiProperty()
  tokenAIdentifier: string;

  @ApiProperty()
  tokenBIdentifier: string;

  @ApiProperty()
  poolShare: number;

  @ApiProperty()
  amountTokenA: number;

  @ApiProperty()
  amountTokenB: number;
}

export class DaoTreasuryDto {
  @ApiProperty()
  amount: number;

  @ApiProperty({ type: [LiquidityProvidingPositionDto] })
  lpPositions: LiquidityProvidingPositionDto[];
}

export class AnalyticsDto {
  @ApiProperty()
  id?: any;

  @ApiProperty()
  day: Date;

  @ApiProperty()
  dayString: string;

  @ApiProperty()
  chain: number;

  @ApiProperty()
  circulatingSupply: CirculatingSupplyDto;

  @ApiProperty()
  burn: BurnDto;

  @ApiProperty()
  daoTreasury: DaoTreasuryDto;

  @ApiProperty()
  liquidityMining: number;

  @ApiProperty()
  communitySale: number;
}
