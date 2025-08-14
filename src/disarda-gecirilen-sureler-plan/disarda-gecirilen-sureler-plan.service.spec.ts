import { Test, TestingModule } from '@nestjs/testing';
import { DisardaGecirilenSurelerPlanService } from './disarda-gecirilen-sureler-plan.service';

describe('DisardaGecirilenSurelerPlanService', () => {
  let service: DisardaGecirilenSurelerPlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisardaGecirilenSurelerPlanService],
    }).compile();

    service = module.get<DisardaGecirilenSurelerPlanService>(DisardaGecirilenSurelerPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
