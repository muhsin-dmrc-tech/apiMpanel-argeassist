import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGiderBilgilerPlanService } from './proje-gider-bilgiler-plan.service';

describe('ProjeGiderBilgilerPlanService', () => {
  let service: ProjeGiderBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeGiderBilgilerPlanService],
    }).compile();

    service = module.get<ProjeGiderBilgilerPlanService>(ProjeGiderBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
