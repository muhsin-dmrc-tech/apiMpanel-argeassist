import { Test, TestingModule } from '@nestjs/testing';
import { FaturalarService } from './faturalar.service';

describe('FaturalarService', () => {
  let service: FaturalarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaturalarService],
    }).compile();

    service = module.get<FaturalarService>(FaturalarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
