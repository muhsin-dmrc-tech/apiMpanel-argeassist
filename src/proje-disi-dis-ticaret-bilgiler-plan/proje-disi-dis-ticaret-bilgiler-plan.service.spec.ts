import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiDisTicaretBilgilerPlanService } from './proje-disi-dis-ticaret-bilgiler-plan.service';

describe('ProjeDisiDisTicaretBilgilerPlanService', () => {
  let service: ProjeDisiDisTicaretBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiDisTicaretBilgilerPlanService],
    }).compile();

    service = module.get<ProjeDisiDisTicaretBilgilerPlanService>(ProjeDisiDisTicaretBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
