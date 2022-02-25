import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyTVLDocument = DailyTVL & Document;

@Schema()
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
