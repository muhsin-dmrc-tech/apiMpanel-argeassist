import { Test, TestingModule } from '@nestjs/testing';
import { MpKullanicilarService } from './mp-kullanicilar.service';

describe('MpKullanicilarService', () => {
  let service: MpKullanicilarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MpKullanicilarService],
    }).compile();

    service = module.get<MpKullanicilarService>(MpKullanicilarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
