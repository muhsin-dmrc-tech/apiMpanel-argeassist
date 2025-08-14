import { Test, TestingModule } from '@nestjs/testing';
import { PdksController } from './pdks.controller';

describe('PdksController', () => {
  let controller: PdksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdksController],
    }).compile();

    controller = module.get<PdksController>(PdksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
