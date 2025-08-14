import { Test, TestingModule } from '@nestjs/testing';
import { ResmitatillerService } from './resmitatiller.service';

describe('ResmitatillerService', () => {
  let service: ResmitatillerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResmitatillerService],
    }).compile();

    service = module.get<ResmitatillerService>(ResmitatillerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
