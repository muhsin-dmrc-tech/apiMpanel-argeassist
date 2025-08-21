import { Test, TestingModule } from '@nestjs/testing';
import { FaturaBilgileriService } from './fatura-bilgileri.service';

describe('FaturaBilgileriService', () => {
  let service: FaturaBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaturaBilgileriService],
    }).compile();

    service = module.get<FaturaBilgileriService>(FaturaBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
