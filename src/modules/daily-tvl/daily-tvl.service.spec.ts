import { Test, TestingModule } from '@nestjs/testing';
import { DailyTvlService } from './daily-tvl.service';

describe('DailyTvlService', () => {
  let service: DailyTvlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyTvlService],
    }).compile();

    service = module.get<DailyTvlService>(DailyTvlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
