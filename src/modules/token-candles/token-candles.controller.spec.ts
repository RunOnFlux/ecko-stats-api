import { Test, TestingModule } from '@nestjs/testing';
import { TokenCandlesController } from './token-candles.controller';

describe('TokenCandlesController', () => {
  let controller: TokenCandlesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenCandlesController],
    }).compile();

    controller = module.get<TokenCandlesController>(TokenCandlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
