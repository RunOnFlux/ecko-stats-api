import { ApiProperty } from '@nestjs/swagger';

export class Token {
  @ApiProperty()
  code: string;
  @ApiProperty()
  name: string | null;
  @ApiProperty()
  symbol: string | null;
  @ApiProperty()
  logoUrl: string | null;
}

export class Pair {
  @ApiProperty()
  code: string;
  @ApiProperty()
  token1: Token;
  @ApiProperty()
  token2: Token;
}
