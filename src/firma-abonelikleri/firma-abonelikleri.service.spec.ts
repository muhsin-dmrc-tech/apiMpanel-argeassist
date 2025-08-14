import { Test, TestingModule } from '@nestjs/testing';
import { FirmaAbonelikleriService } from './firma-abonelikleri.service';

describe('FirmaAbonelikleriService', () => {
  let service: FirmaAbonelikleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirmaAbonelikleriService],
    }).compile();

    service = module.get<FirmaAbonelikleriService>(FirmaAbonelikleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
