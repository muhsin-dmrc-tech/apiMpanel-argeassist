import { Test, TestingModule } from '@nestjs/testing';
import { BildirimlerService } from './bildirimler.service';

describe('BildirimlerService', () => {
  let service: BildirimlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BildirimlerService],
    }).compile();

    service = module.get<BildirimlerService>(BildirimlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
