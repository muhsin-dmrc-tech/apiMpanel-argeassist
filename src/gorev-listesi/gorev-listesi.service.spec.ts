import { Test, TestingModule } from '@nestjs/testing';
import { GorevListesiService } from './gorev-listesi.service';

describe('GorevListesiService', () => {
  let service: GorevListesiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GorevListesiService],
    }).compile();

    service = module.get<GorevListesiService>(GorevListesiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
