import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const LIQUIDITY_POOLS_COLLECTION_NAME = 'liquidity_pools';

export type LiquidityPoolsDocument = LiquidityPools & Document;

@Schema({ collection: LIQUIDITY_POOLS_COLLECTION_NAME })
export class LiquidityPools {
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop()
  pairCode: string;

  @Prop()
  chain: number;

  @Prop()
  tokenFrom: string;

  @Prop()
  tokenTo: string;

  @Prop()
  tokenFromTVL: number;

  @Prop()
  tokenToTVL: number;
}

export const LiquidityPoolsSchema =
  SchemaFactory.createForClass(LiquidityPools);
