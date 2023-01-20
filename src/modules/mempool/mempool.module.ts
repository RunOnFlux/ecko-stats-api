import { Module } from '@nestjs/common';
import { MempoolService } from './mempool.service';
import { MempoolController } from './mempool.controller';
import { MempoolImporter } from './mempool.importer';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { GasData, GasDataSchema } from './schemas/gas-data.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: GasData.name, schema: GasDataSchema }]),
  ],
  providers: [MempoolService, MempoolImporter],
  controllers: [MempoolController],
})
export class MempoolModule {}
