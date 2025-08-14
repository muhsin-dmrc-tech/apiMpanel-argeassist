import { Test, TestingModule } from '@nestjs/testing';
import { ProjeDisiGiderBilgileriService } from './proje-disi-gider-bilgileri.service';

describe('ProjeDisiGiderBilgileriService', () => {
  let service: ProjeDisiGiderBilgileriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeDisiGiderBilgileriService],
    }).compile();

    service = module.get<ProjeDisiGiderBilgileriService>(ProjeDisiGiderBilgileriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
