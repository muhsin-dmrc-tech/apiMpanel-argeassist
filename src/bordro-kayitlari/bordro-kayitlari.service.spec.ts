import { Test, TestingModule } from '@nestjs/testing';
import { BordroKayitlariService } from './bordro-kayitlari.service';

describe('BordroKayitlariService', () => {
  let service: BordroKayitlariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BordroKayitlariService],
    }).compile();

    service = module.get<BordroKayitlariService>(BordroKayitlariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
