import { Test, TestingModule } from '@nestjs/testing';
import { ProjeRaporlariService } from './proje-raporlari.service';

describe('ProjeRaporlariService', () => {
  let service: ProjeRaporlariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeRaporlariService],
    }).compile();

    service = module.get<ProjeRaporlariService>(ProjeRaporlariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
