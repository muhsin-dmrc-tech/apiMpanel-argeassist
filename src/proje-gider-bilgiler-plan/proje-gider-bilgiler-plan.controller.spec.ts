import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGiderBilgilerPlanController } from './proje-gider-bilgiler-plan.controller';

describe('ProjeGiderBilgilerPlanController', () => {
  let controller: ProjeGiderBilgilerPlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjeGiderBilgilerPlanController],
    }).compile();

    controller = module.get<ProjeGiderBilgilerPlanController>(ProjeGiderBilgilerPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
