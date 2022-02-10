import { Types } from 'mongoose';

export class DailyVolumeDto {
  id?: any;

  day: Date;

  chain: number;

  tokenFromNamespace: string;

  tokenFromName: string;

  tokenToNamespace: string;

  tokenToName: string;

  tokenFromVolume: number;

  tokenToVolume: number;
}
