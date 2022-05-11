import { ApiProperty } from '@nestjs/swagger';

export class VolumeDto {
  @ApiProperty()
  id?: any;

  @ApiProperty({ example: 'runonflux' })
  tokenFromNamespace: string;

  @ApiProperty({ example: 'flux' })
  tokenFromName: string;

  @ApiProperty({ example: null })
  tokenToNamespace: string;

  @ApiProperty({ example: 'coin' })
  tokenToName: string;

  @ApiProperty({ example: 165800 })
  tokenFromVolume: number;

  @ApiProperty({ example: 42147.87 })
  tokenToVolume: number;
}
