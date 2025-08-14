import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciDavetleriService } from './kullanici-davetleri.service';

describe('KullaniciDavetleriService', () => {
  let service: KullaniciDavetleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KullaniciDavetleriService],
    }).compile();

    service = module.get<KullaniciDavetleriService>(KullaniciDavetleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
