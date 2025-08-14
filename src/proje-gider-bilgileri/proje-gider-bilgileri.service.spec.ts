import { Test, TestingModule } from '@nestjs/testing';
import { ProjeGiderBilgileriService } from './proje-gider-bilgileri.service';

describe('ProjeGiderBilgileriService', () => {
  let service: ProjeGiderBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeGiderBilgileriService],
    }).compile();

    service = module.get<ProjeGiderBilgileriService>(ProjeGiderBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
