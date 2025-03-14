import { Test, TestingModule } from '@nestjs/testing';
import { DailyVolumesService } from './daily-volume.service';

describe('DailyVolumeService', () => {
  let service: DailyVolumesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyVolumesService],
    }).compile();

    service = module.get<DailyVolumesService>(DailyVolumesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
