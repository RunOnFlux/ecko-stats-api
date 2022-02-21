import { Test, TestingModule } from '@nestjs/testing';
import { DailyVolumeController } from './daily-volume.controller';

describe('DailyVolumeController', () => {
  let controller: DailyVolumeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyVolumeController],
    }).compile();

    controller = module.get<DailyVolumeController>(DailyVolumeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
