import { Test, TestingModule } from '@nestjs/testing';
import { SohbetlerController } from './sohbetler.controller';

describe('SohbetlerController', () => {
  let controller: SohbetlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SohbetlerController],
    }).compile();

    controller = module.get<SohbetlerController>(SohbetlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
