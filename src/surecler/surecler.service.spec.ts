import { Test, TestingModule } from '@nestjs/testing';
import { SureclerService } from './surecler.service';

describe('SureclerService', () => {
  let service: SureclerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SureclerService],
    }).compile();

    service = module.get<SureclerService>(SureclerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
