import { Test, TestingModule } from '@nestjs/testing';
import { PdksService } from './pdks.service';

describe('PdksService', () => {
  let service: PdksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdksService],
    }).compile();

    service = module.get<PdksService>(PdksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
