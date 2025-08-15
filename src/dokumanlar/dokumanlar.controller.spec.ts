import { Test, TestingModule } from '@nestjs/testing';
import { DokumanlarController } from './dokumanlar.controller';

describe('DokumanlarController', () => {
  let controller: DokumanlarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DokumanlarController],
    }).compile();

    controller = module.get<DokumanlarController>(DokumanlarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
