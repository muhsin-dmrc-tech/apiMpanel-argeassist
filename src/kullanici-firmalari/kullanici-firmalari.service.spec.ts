import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciFirmalariService } from './kullanici-firmalari.service';

describe('KullaniciFirmalariService', () => {
  let service: KullaniciFirmalariService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KullaniciFirmalariService],
    }).compile();

    service = module.get<KullaniciFirmalariService>(KullaniciFirmalariService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
