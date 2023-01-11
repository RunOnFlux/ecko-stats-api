import { Test, TestingModule } from '@nestjs/testing';
import { MempoolController } from './mempool.controller';

describe('MempoolController', () => {
  let controller: MempoolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MempoolController],
    }).compile();

    controller = module.get<MempoolController>(MempoolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
