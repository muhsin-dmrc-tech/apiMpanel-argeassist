import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGelirBilgilerPlanController } from './proje-gelir-bilgiler-plan.controller';

describe('ProjeGelirBilgilerPlanController', () => {
  let controller: ProjeGelirBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeGelirBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeGelirBilgilerPlanController>(ProjeGelirBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
