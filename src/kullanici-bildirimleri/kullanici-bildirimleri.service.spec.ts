import { Test, TestingModule } from '@nestjs/testing';
import { KullaniciBildirimleriService } from './kullanici-bildirimleri.service';

describe('KullaniciBildirimleriService', () => {
  let service: KullaniciBildirimleriService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KullaniciBildirimleriService],
    }).compile();

    service = module.get<KullaniciBildirimleriService>(KullaniciBildirimleriService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
