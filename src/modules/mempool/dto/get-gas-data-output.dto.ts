import { ApiProperty } from '@nestjs/swagger';

export class GetGasDataOutput {
  @ApiProperty()
  networkCongested: boolean;

  @ApiProperty()
  suggestedGasPrice: number;

  @ApiProperty()
  highestGasPrice: number;

  @ApiProperty()
  lowestGasPrice: number;
}
