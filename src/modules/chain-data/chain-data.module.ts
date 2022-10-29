import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChainDataController } from './chain-data.controller';
import { ChainDataImporter } from './chain-data.importer';
import { ChainDataService } from './chain-data.service';
import { ChainData, ChainDataSchema } from './schemas/chain-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChainData.name, schema: ChainDataSchema },
    ]),
  ],
  controllers: [ChainDataController],
  providers: [ChainDataService, ChainDataImporter],
})
export class ChainDataModule {}
