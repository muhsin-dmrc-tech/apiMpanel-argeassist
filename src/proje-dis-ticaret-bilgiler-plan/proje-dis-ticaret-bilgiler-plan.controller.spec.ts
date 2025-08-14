import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisTicaretBilgilerPlanController } from './proje-dis-ticaret-bilgiler-plan.controller';

describe('ProjeDisTicaretBilgilerPlanController', () => {
  let controller: ProjeDisTicaretBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeDisTicaretBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeDisTicaretBilgilerPlanController>(ProjeDisTicaretBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
