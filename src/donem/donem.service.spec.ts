import { Test, TestingModule } from '@nestjs/testing';
import { DonemService } from './donem.service';

describe('DonemService', () => {
  let service: DonemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DonemService],
    }).compile();

    service = module.get<DonemService>(DonemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
