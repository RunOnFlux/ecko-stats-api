import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const ANALYTICS_COLLECTION_NAME = 'analytics';

export type AnalyticsDocument = Analytics & Document;

@Schema()
export class Analytics {
  @Prop()
  lastUpdate: Date;

  @Prop()
  chain: number;

  @Prop()
  circulatingSupply: number;

  @Prop()
  burned: number;

  @Prop()
  daoTreasury: number;

  @Prop()
  liquidityMining: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
