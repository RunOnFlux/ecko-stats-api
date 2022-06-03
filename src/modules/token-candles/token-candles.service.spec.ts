import { Test, TestingModule } from '@nestjs/testing';
import { TokenCandlesService } from './token-candles.service';

describe('TokenCandlesService', () => {
  let service: TokenCandlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenCandlesService],
    }).compile();

    service = module.get<TokenCandlesService>(TokenCandlesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
