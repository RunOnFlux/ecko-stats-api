import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const TOKEN_DATA_COLLECTION_NAME = 'token_data';

export type TokenDataDocument = TokenData & Document;

@Schema({ collection: TOKEN_DATA_COLLECTION_NAME })
export class TokenData {
  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  tokenId: string;

  @Prop()
  totalSupply: number;

  @Prop()
  circulatingSupply: number;

  @Prop()
  updatedAt: Date;
}

export const TokenDataSchema = SchemaFactory.createForClass(TokenData);
