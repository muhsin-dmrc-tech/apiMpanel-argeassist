import { Test, TestingModule } from '@nestjs/testing';
import { SureclerController } from './surecler.controller';

describe('SureclerController', () => {
  let controller: SureclerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SureclerController],
    }).compile();

    controller = module.get<SureclerController>(SureclerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
