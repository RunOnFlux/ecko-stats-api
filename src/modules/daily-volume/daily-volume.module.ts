import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyVolumesService } from './daily-volume.service';
import { DailyVolume, DailyVolumeSchema } from './schemas/daily-volume.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyVolume.name, schema: DailyVolumeSchema },
    ]),
  ],
  providers: [DailyVolumesService],
  exports: [DailyVolumesService],
})
export class DailyVolumeModule {}
