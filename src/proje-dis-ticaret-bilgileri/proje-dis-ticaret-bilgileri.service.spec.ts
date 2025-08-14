import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisTicaretBilgileriService } from './proje-dis-ticaret-bilgileri.service';

describe('ProjeDisTicaretBilgileriService', () => {
  let service: ProjeDisTicaretBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisTicaretBilgileriService],
    }).compile();

    service = module.get<ProjeDisTicaretBilgileriService>(ProjeDisTicaretBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
