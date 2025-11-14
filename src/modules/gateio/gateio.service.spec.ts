import { Test, TestingModule } from '@nestjs/testing';
import { GateioService } from './gateio.service';

describe('GateioService', () => {
  let service: GateioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GateioService],
    }).compile();

    service = module.get<GateioService>(GateioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

