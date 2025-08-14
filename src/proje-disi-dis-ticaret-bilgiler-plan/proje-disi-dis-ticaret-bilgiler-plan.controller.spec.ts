import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiDisTicaretBilgilerPlanController } from './proje-disi-dis-ticaret-bilgiler-plan.controller';

describe('ProjeDisiDisTicaretBilgilerPlanController', () => {
  let controller: ProjeDisiDisTicaretBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisiDisTicaretBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeDisiDisTicaretBilgilerPlanController>(ProjeDisiDisTicaretBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
