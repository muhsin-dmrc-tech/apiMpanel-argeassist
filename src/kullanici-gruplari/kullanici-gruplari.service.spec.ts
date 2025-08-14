import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciGruplariService } from './kullanici-gruplari.service';

describe('KullaniciGruplariService', () => {
  let service: KullaniciGruplariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KullaniciGruplariService],
    }).compile();

    service = module.get<KullaniciGruplariService>(KullaniciGruplariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
