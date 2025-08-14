import { Test, TestingModule } from '@nestjs/testing';
import { ProjeIlerlemeBilgilerPlanService } from './proje-ilerleme-bilgiler-plan.service';

describe('ProjeIlerlemeBilgilerPlanService', () => {
  let service: ProjeIlerlemeBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeIlerlemeBilgilerPlanService],
    }).compile();

    service = module.get<ProjeIlerlemeBilgilerPlanService>(ProjeIlerlemeBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
