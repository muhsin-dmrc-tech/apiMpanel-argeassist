import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGelirBilgileriService } from './proje-disi-gelir-bilgileri.service';

describe('ProjeDisiGelirBilgileriService', () => {
  let service: ProjeDisiGelirBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiGelirBilgileriService],
    }).compile();

    service = module.get<ProjeDisiGelirBilgileriService>(ProjeDisiGelirBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
