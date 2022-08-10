import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const ANALYTICS_COLLECTION_NAME = 'analytics';

export type AnalyticsDocument = Analytics & Document;

export class CirculatingSupply {
  @Prop()
  totalSupply: number;

  @Prop()
  lockedAmount: number;

  @Prop()
  stakedAmount: number;
}

export class Burn {
  @Prop()
  tokenBurn: number;

  @Prop()
  stakingBurn: number;
}

export class LiquidityProvidingPosition {
  @Prop()
  tokenAIdentifier: string;

  @Prop()
  tokenBIdentifier: string;

  @Prop()
  poolShare: number;

  @Prop()
  amountTokenA: number;

  @Prop()
  amountTokenB: number;
}

export class DaoTreasury {
  @Prop()
  amount: number;

  @Prop()
  lpPositions: LiquidityProvidingPosition[];
}

@Schema()
export class Analytics {
  @Prop()
  day: Date;

  @Prop()
  dayString: string;

  @Prop()
  chain: number;

  @Prop()
  circulatingSupply: CirculatingSupply;

  @Prop()
  burn: Burn;

  @Prop()
  daoTreasury: DaoTreasury;

  @Prop()
  liquidityMining: number;

  @Prop()
  communitySale: number;
}

export const AnalyticsSchema = SchemaFactory.createForClass(Analytics);
