import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGiderBilgilerPlanService } from './proje-disi-gider-bilgiler-plan.service';

describe('ProjeDisiGiderBilgilerPlanService', () => {
  let service: ProjeDisiGiderBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiGiderBilgilerPlanService],
    }).compile();

    service = module.get<ProjeDisiGiderBilgilerPlanService>(ProjeDisiGiderBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
