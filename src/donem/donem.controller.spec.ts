import { Test, TestingModule } from '@nestjs/testing';
import { DonemController } from './donem.controller';

describe('DonemController', () => {
  let controller: DonemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DonemController],
    }).compile();

    controller = module.get<DonemController>(DonemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
