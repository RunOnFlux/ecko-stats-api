import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyVolumesService } from './daily-volume.service';
import { DailyVolume, DailyVolumeSchema } from './schemas/daily-volume.schema';
import { DailyVolumeController } from './daily-volume.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyVolume.name, schema: DailyVolumeSchema },
    ]),
    HttpModule,
  ],
  providers: [DailyVolumesService],
  exports: [DailyVolumesService],
  controllers: [DailyVolumeController],
})
export class DailyVolumeModule {}
