import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGelirBilgileriService } from './proje-gelir-bilgileri.service';

describe('ProjeGelirBilgileriService', () => {
  let service: ProjeGelirBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeGelirBilgileriService],
    }).compile();

    service = module.get<ProjeGelirBilgileriService>(ProjeGelirBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
