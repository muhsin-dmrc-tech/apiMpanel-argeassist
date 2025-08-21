import { Test, TestingModule } from '@nestjs/testing';
import { BordroHesaplamaService } from './bordro-hesaplama.service';

describe('BordroHesaplamaService', () => {
  let service: BordroHesaplamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BordroHesaplamaService],
    }).compile();

    service = module.get<BordroHesaplamaService>(BordroHesaplamaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
