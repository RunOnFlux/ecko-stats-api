import { Module } from '@nestjs/common';
import { TokenDataService } from './token-data.service';
import { TokenDataController } from './token-data.controller';
import { TokenData, TokenDataSchema } from './schemas/token-data.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenDataImporter } from './token-data.importer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenData.name, schema: TokenDataSchema },
    ]),
  ],
  providers: [TokenDataService, TokenDataImporter],
  exports: [TokenDataService],
  controllers: [TokenDataController],
})
export class TokenDataModule {}
