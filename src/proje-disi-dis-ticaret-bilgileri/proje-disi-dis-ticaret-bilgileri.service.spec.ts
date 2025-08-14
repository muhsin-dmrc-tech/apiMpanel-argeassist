import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiDisTicaretBilgileriService } from './proje-disi-dis-ticaret-bilgileri.service';

describe('ProjeDisiDisTicaretBilgileriService', () => {
  let service: ProjeDisiDisTicaretBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiDisTicaretBilgileriService],
    }).compile();

    service = module.get<ProjeDisiDisTicaretBilgileriService>(ProjeDisiDisTicaretBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
