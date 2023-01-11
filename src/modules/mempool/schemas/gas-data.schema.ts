import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export const GAS_DATA_COLLECTION_NAME = 'gas_data';

export type GasDataDocument = GasData & Document;

@Schema({ collection: GAS_DATA_COLLECTION_NAME })
export class GasData {
  @ApiProperty()
  @Prop()
  networkCongested: boolean;

  @ApiProperty()
  @Prop()
  suggestedGasPrice: number;

  @ApiProperty()
  @Prop()
  highestGasPrice: number;

  @ApiProperty()
  @Prop()
  lowestGasPrice: number;

  @ApiProperty()
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const GasDataSchema = SchemaFactory.createForClass(GasData);
