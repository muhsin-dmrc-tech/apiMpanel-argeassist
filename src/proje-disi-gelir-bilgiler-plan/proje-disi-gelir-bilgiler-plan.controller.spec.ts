import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGelirBilgilerPlanController } from './proje-disi-gelir-bilgiler-plan.controller';

describe('ProjeDisiGelirBilgilerPlanController', () => {
  let controller: ProjeDisiGelirBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiGelirBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeDisiGelirBilgilerPlanController>(ProjeDisiGelirBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
