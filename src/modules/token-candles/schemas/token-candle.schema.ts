import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenCandleDocument = TokenCandle & Document;

export class PriceEmbedded {
  @Prop()
  open: number;

  @Prop()
  close: number;

  @Prop()
  high: number;

  @Prop()
  low: number;
}

@Schema()
export class TokenCandle {
  @Prop()
  day: Date;

  @Prop()
  dayString: string;

  @Prop()
  chain: number;

  @Prop()
  pairName: string;

  @Prop()
  price: PriceEmbedded;

  @Prop()
  usdPrice: PriceEmbedded;

  @Prop()
  volume: number;
}

export const TokenCandleSchema = SchemaFactory.createForClass(TokenCandle);
