import { Test, TestingModule } from '@nestjs/testing';
import { ProjeIlerlemeBilgilerService } from './proje-ilerleme-bilgiler.service';

describe('ProjeIlerlemeBilgilerService', () => {
  let service: ProjeIlerlemeBilgilerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjeIlerlemeBilgilerService],
    }).compile();

    service = module.get<ProjeIlerlemeBilgilerService>(ProjeIlerlemeBilgilerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
