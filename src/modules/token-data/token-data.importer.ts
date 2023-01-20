import { ConsoleLogger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Command, Console } from 'nestjs-console';
import { Connection } from 'mongoose';
import { TokenDataService } from './token-data.service';
import { TOKENS } from 'src/data/tokens';

@Console()
export class TokenDataImporter {
  private readonly logger = new ConsoleLogger(TokenDataImporter.name);
  constructor(
    @InjectConnection() private connection: Connection,
    private readonly tokenDataService: TokenDataService,
  ) {}

  @Command({
    command: 'import:token-data <tokenId>',
  })
  async tokenDataImportCommand(tokenId: string) {
    this.logger.log(`START MANUAL IMPORT TOKEN DATA FOR ${tokenId}`);
    const token = TOKENS[tokenId];
    if (token && token.supplyConfig) {
      await this.tokenDataService.handleTokenData(
        tokenId,
        token.supplyConfig.tokenTableName,
        token.supplyConfig.balanceFieldName,
        token.supplyConfig.liquidityHolderAccounts,
      );
    } else {
      this.logger.log('Invalid token or missing configuration');
    }
    this.logger.log(`END MANUAL IMPORT TOKEN DATA FOR ${tokenId}`);
  }
}
