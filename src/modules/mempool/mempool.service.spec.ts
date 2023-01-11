import { Test, TestingModule } from '@nestjs/testing';
import { MempoolService } from './mempool.service';

describe('MempoolService', () => {
  let service: MempoolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MempoolService],
    }).compile();

    service = module.get<MempoolService>(MempoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
