import { Test, TestingModule } from '@nestjs/testing';
import { FirmaMuafiyetBilgilerPlanService } from './firma-muafiyet-bilgiler-plan.service';

describe('FirmaMuafiyetBilgilerPlanService', () => {
  let service: FirmaMuafiyetBilgilerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirmaMuafiyetBilgilerPlanService],
    }).compile();

    service = module.get<FirmaMuafiyetBilgilerPlanService>(FirmaMuafiyetBilgilerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
