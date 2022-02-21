import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DailyVolumeDocument = DailyVolume & Document;

@Schema()
export class DailyVolume {
  @Prop()
  day: Date;

  @Prop()
  dayString: string;

  @Prop()
  chain: number;

  @Prop()
  tokenFromNamespace: string;

  @Prop()
  tokenFromName: string;

  @Prop()
  tokenToNamespace: string;

  @Prop()
  tokenToName: string;

  @Prop()
  tokenFromVolume: number;

  @Prop()
  tokenToVolume: number;
}

export const DailyVolumeSchema = SchemaFactory.createForClass(DailyVolume);
