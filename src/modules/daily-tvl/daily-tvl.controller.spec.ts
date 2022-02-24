import { Test, TestingModule } from '@nestjs/testing';
import { DailyTvlController } from './daily-tvl.controller';

describe('DailyTvlController', () => {
  let controller: DailyTvlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyTvlController],
    }).compile();

    controller = module.get<DailyTvlController>(DailyTvlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
