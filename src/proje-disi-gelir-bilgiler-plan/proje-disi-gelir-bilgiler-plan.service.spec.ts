import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGelirBilgilerPlanService } from './proje-disi-gelir-bilgiler-plan.service';

describe('ProjeDisiGelirBilgilerPlanService', () => {
  let service: ProjeDisiGelirBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiGelirBilgilerPlanService],
    }).compile();

    service = module.get<ProjeDisiGelirBilgilerPlanService>(ProjeDisiGelirBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
