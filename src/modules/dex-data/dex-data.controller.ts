import { CacheTTL, Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { DailyVolumesService } from '../daily-volume/daily-volume.service';
import { DexDataService } from './dex-data.service';
import { CMMTickerResponseDto } from './dto/CMMTicker.dto';
import { PairDto } from './dto/pair.dto';
import { CoingeckoTickerDto } from './dto/CoingeckoTicker.dto';
import { CoingeckoService } from '../coingecko/coingecko.service';

@Controller('dex-data')
@ApiTags('Dex Data')
export class DexDataController {
  constructor(
    private readonly dexDataService: DexDataService,
    private readonly dailyVolumeService: DailyVolumesService,
    private readonly coingeckoService: CoingeckoService,
  ) {}

  @Get('pairs')
  @ApiOperation({ summary: `Get pairs data` })
  @ApiOkResponse({
    type: [PairDto],
  })
  async getPairs() {
    return this.dexDataService.getPairs();
  }

  @Get('tickers')
  @CacheTTL(30)
  @ApiOperation({ summary: `Get tickers data` })
  @ApiOkResponse({
    type: [CoingeckoTickerDto],
  })
  async getTickers() {
    const volumes = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
      moment().subtract(1, 'days').format('YYYY-MM-DD'),
    );

    let result: CoingeckoTickerDto[] = [];

    if (volumes && volumes.length) {
      const kdaUsdPrice = await this.coingeckoService.getKdaUsdPrice();
      result = await this.dexDataService.getCGTickers(volumes, kdaUsdPrice);
    }

    return result;
  }

  @Get('cmm-tickers')
  @ApiOperation({ summary: `Get CMM tickers data` })
  @ApiOkResponse({
    type: CMMTickerResponseDto,
  })
  async getCMMTickers() {
    const volumes = await this.dailyVolumeService.findAll(
      'kswap.exchange.SWAP',
      moment().format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    );

    let result: CMMTickerResponseDto;

    if (volumes && volumes.length) {
      const kdaUsdPrice = await this.coingeckoService.getKdaUsdPrice();
      result = await this.dexDataService.getCMMTickers(volumes, kdaUsdPrice);
    }

    return result;
  }

  @Get('kdx-circulating-supply')
  @ApiOperation({ summary: `Get KDX circulating supply` })
  @ApiOkResponse({
    type: Number,
  })
  async getKDXCirculatingSupply() {
    return await this.dexDataService.getKDXCirculatingSupply();
  }

  @Get('kdx-total-supply')
  @ApiOperation({ summary: `Get KDX total supply` })
  @ApiOkResponse({
    type: Number,
  })
  async getKDXTotalSupply() {
    return await this.dexDataService.getKDXTotalSupply();
  }
}
