import { IsDateString, IsNotEmpty } from 'class-validator';

export class GetDailyVolumeArgs {
  @IsNotEmpty()
  eventName: string;

  @IsNotEmpty()
  @IsDateString()
  dateStart: Date;

  @IsNotEmpty()
  @IsDateString()
  dateEnd: Date;
}
