import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TokenCandleDto } from './dto/token-candle.dto';
import { TokenCandlesService } from './token-candles.service';

@Controller('candles')
export class TokenCandlesController {
  constructor(private readonly tokenCandlesService: TokenCandlesService) {}

  @Get()
  @ApiOperation({ summary: `Get OHCL` })
  @ApiOkResponse({
    type: [TokenCandleDto],
  })
  @ApiQuery({ name: 'currency', type: String, example: 'coin' })
  @ApiQuery({ name: 'asset', type: String, example: 'runonflux.flux' })
  @ApiQuery({ name: 'dateStart', type: Date, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'dateEnd', type: Date, description: 'YYYY-MM-DD' })
  async dailyVolume(
    @Query('currency') currency: string,
    @Query('asset') asset: string,
    @Query('dateStart') dateStart: Date,
    @Query('dateEnd') dateEnd: Date,
  ) {
    return await this.tokenCandlesService.findAll(
      `${asset}/${currency}`,
      dateStart,
      dateEnd,
    );
  }
}
