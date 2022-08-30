import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as moment from 'moment';
import { DailyVolumesService } from '../daily-volume/daily-volume.service';
import { DexDataService } from './dex-data.service';
import {
  CMMTickerDto,
  CMMTickerDtoInterface,
  CMMTickerResponseDto,
} from './dto/CMMTicker.dto';
import { PairDto } from './dto/pair.dto';
import { TickerDto } from './dto/ticker.dto';

@Controller('dex-data')
@ApiTags('Dex-Data')
export class DexDataController {
  constructor(
    private readonly dexDataService: DexDataService,
    private readonly dailyVolumeService: DailyVolumesService,
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
  @ApiOperation({ summary: `Get tickers data` })
  @ApiOkResponse({
    type: [TickerDto],
  })
  async getTickers() {
    const dailyVolumes = await this.dailyVolumeService.findAllAggregateByDay(
      'kswap.exchange.SWAP',
      moment().format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    );

    let result: TickerDto[] = [];

    if (dailyVolumes && dailyVolumes.length) {
      result = this.dexDataService.getCGTickers(dailyVolumes);
    }

    return result;
  }

  @Get('cmm-tickers')
  @ApiOperation({ summary: `Get CMM tickers data` })
  @ApiOkResponse({
    type: CMMTickerResponseDto,
  })
  async getCMMTickers() {
    const dailyVolumes = await this.dailyVolumeService.findAllAggregateByDay(
      'kswap.exchange.SWAP',
      moment().format('YYYY-MM-DD'),
      moment().format('YYYY-MM-DD'),
    );

    let result: CMMTickerResponseDto;

    if (dailyVolumes && dailyVolumes.length) {
      result = this.dexDataService.getCMMTickers(dailyVolumes);
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
}
