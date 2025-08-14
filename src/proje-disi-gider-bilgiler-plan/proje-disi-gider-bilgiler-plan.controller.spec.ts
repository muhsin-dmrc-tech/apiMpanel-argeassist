import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGiderBilgilerPlanController } from './proje-disi-gider-bilgiler-plan.controller';

describe('ProjeDisiGiderBilgilerPlanController', () => {
  let controller: ProjeDisiGiderBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiGiderBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeDisiGiderBilgilerPlanController>(ProjeDisiGiderBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
