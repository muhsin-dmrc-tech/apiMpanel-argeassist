import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGelirBilgilerPlanService } from './proje-gelir-bilgiler-plan.service';

describe('ProjeGelirBilgilerPlanService', () => {
  let service: ProjeGelirBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeGelirBilgilerPlanService],
    }).compile();

    service = module.get<ProjeGelirBilgilerPlanService>(ProjeGelirBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
