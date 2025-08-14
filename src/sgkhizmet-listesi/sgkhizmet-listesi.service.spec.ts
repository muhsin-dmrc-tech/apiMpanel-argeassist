import { Test, TestingModule } from '@nestjs/testing';
import { SgkhizmetListesiService } from './sgkhizmet-listesi.service';

describe('SgkhizmetListesiService', () => {
  let service: SgkhizmetListesiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SgkhizmetListesiService],
    }).compile();

    service = module.get<SgkhizmetListesiService>(SgkhizmetListesiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
