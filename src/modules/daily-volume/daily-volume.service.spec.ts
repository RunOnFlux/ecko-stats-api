import { Test, TestingModule } from '@nestjs/testing';
import { DailyVolumeService } from './daily-volume.service';

describe('DailyVolumeService', () => {
  let service: DailyVolumeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyVolumeService],
    }).compile();

    service = module.get<DailyVolumeService>(DailyVolumeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
