import { Test, TestingModule } from '@nestjs/testing';
import { SiparislerService } from './siparisler.service';

describe('SiparislerService', () => {
  let service: SiparislerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiparislerService],
    }).compile();

    service = module.get<SiparislerService>(SiparislerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
