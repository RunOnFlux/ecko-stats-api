import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChainDataService } from './chain-data.service';
import { ChainData } from './schemas/chain-data.schema';

@Controller('chain-data')
@ApiTags('Chain Data')
export class ChainDataController {
  constructor(private readonly chainDataService: ChainDataService) {}

  @Get('fungible-tokens')
  @ApiOperation({ summary: `Get available fungible tokens for all chains` })
  @ApiOkResponse({
    type: ChainData,
  })
  async findAll() {
    return await this.chainDataService.getChainData();
  }
}
