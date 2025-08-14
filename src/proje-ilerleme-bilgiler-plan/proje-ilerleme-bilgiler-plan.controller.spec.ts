import { Test, TestingModule } from '@nestjs/testing';
import { ProjeIlerlemeBilgilerPlanController } from './proje-ilerleme-bilgiler-plan.controller';

describe('ProjeIlerlemeBilgilerPlanController', () => {
  let controller: ProjeIlerlemeBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeIlerlemeBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeIlerlemeBilgilerPlanController>(ProjeIlerlemeBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
