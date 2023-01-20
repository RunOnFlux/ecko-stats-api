import { Test, TestingModule } from '@nestjs/testing';
import { TokenDataController } from './token-data.controller';

describe('TokenDataController', () => {
  let controller: TokenDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenDataController],
    }).compile();

    controller = module.get<TokenDataController>(TokenDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
