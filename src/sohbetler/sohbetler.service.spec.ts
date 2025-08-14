import { Test, TestingModule } from '@nestjs/testing';
import { SohbetlerService } from './sohbetler.service';

describe('SohbetlerService', () => {
  let service: SohbetlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SohbetlerService],
    }).compile();

    service = module.get<SohbetlerService>(SohbetlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
