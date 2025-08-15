import { Test, TestingModule } from '@nestjs/testing';
import { DokumanlarService } from './dokumanlar.service';

describe('DokumanlarService', () => {
  let service: DokumanlarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DokumanlarService],
    }).compile();

    service = module.get<DokumanlarService>(DokumanlarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
