import { Test, TestingModule } from '@nestjs/testing';
import { FaturalarController } from './faturalar.controller';

describe('FaturalarController', () => {
  let controller: FaturalarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FaturalarController],
    }).compile();

    controller = module.get<FaturalarController>(FaturalarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
