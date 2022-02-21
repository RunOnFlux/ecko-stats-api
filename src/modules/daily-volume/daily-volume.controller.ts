import { Controller } from '@nestjs/common';
import { DailyVolumesService } from './daily-volume.service';

@Controller('daily-volume')
export class DailyVolumeController {
  constructor(private readonly dalyVolumeService: DailyVolumesService) {}
}
