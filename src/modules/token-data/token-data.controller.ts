import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TokenData } from './schemas/token-data.schema';
import { TokenDataService } from './token-data.service';
import {Token, Pair} from './types';

@Controller('token-data')
@ApiTags('Token Data')
export class TokenDataController {
  constructor(private readonly tokenDataService: TokenDataService) {}

  @Get('token-data')
  @ApiOperation({ summary: `Get token data` })
  @ApiOkResponse({
    type: TokenData,
  })
  @ApiQuery({ name: 'tokenId', type: String, description: 'kaddex.kdx' })
  async find(@Query('tokenId') tokenId: String) {
    return await this.tokenDataService.getTokenData(tokenId);
  }

  @Get('tokens')
  @ApiOperation({ summary: `Get tokens` })
  @ApiOkResponse({
    type: [Token],
  })
  async getTokens(): Promise<Token[]> {
    return await this.tokenDataService.getTokens();
  }

  @Get('pairs')
  @ApiOperation({ summary: `Get pairs` })
  @ApiOkResponse({
    type: [Pair],
  })
  async getPairs(): Promise<Pair[]> {
    return await this.tokenDataService.getPairs();
  }
}
