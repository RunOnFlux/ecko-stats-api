import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const TVL_COLLECTION_NAME = 'tvl';
export const TVL_COMMAND_NAME = 'kswap.exchange.UPDATE';
export const TVL_COMMAND_NAME_2 = 'kaddex.exchange.UPDATE';

export type DailyTVLDocument = DailyTVL & Document;

@Schema({ collection: TVL_COLLECTION_NAME })
export class DailyTVL {
  @Prop()
  day: Date;

  @Prop()
  dayString: string;

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

export const DailyTVLSchema = SchemaFactory.createForClass(DailyTVL);
