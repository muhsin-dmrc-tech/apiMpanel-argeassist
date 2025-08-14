import { Test, TestingModule } from '@nestjs/testing';
import { PdksplanController } from './pdksplan.controller';

describe('PdksplanController', () => {
  let controller: PdksplanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdksplanController],
    }).compile();

    controller = module.get<PdksplanController>(PdksplanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
