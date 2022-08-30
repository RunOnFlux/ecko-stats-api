import { Test, TestingModule } from '@nestjs/testing';
import { DexDataService } from './dex-data.service';

describe('DexDataService', () => {
  let service: DexDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DexDataService],
    }).compile();

    service = module.get<DexDataService>(DexDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
