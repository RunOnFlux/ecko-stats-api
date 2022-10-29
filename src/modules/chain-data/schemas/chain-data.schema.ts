import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export const CHAIN_DATA_COLLECTION_NAME = 'chain_data';

export type ChainDataDocument = ChainData & Document;

@Schema({ collection: CHAIN_DATA_COLLECTION_NAME })
export class ChainData {
  @ApiProperty()
  @Prop()
  fungibleTokens: string[][];
}

export const ChainDataSchema = SchemaFactory.createForClass(ChainData);
