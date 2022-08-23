import { Test, TestingModule } from '@nestjs/testing';
import { DexDataController } from './dex-data.controller';

describe('DexDataController', () => {
  let controller: DexDataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DexDataController],
    }).compile();

    controller = module.get<DexDataController>(DexDataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
