import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisTicaretBilgilerPlanService } from './proje-dis-ticaret-bilgiler-plan.service';

describe('ProjeDisTicaretBilgilerPlanService', () => {
  let service: ProjeDisTicaretBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisTicaretBilgilerPlanService],
    }).compile();

    service = module.get<ProjeDisTicaretBilgilerPlanService>(ProjeDisTicaretBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
