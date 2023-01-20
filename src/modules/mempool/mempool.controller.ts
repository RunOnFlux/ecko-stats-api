import { CacheTTL, Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetGasDataOutput } from './dto/get-gas-data-output.dto';
import { MempoolService } from './mempool.service';

@Controller('mempool')
@ApiTags('Mempool Data')
export class MempoolController {
  constructor(private readonly mempoolService: MempoolService) {}

  @Get('get-gas-data')
  @CacheTTL(30)
  @ApiOperation({ summary: `Get gas data` })
  @ApiOkResponse({
    type: GetGasDataOutput,
  })
  async getGasData() {
    return await this.mempoolService.getGasData();
  }
}
