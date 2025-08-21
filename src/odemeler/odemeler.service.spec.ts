import { Test, TestingModule } from '@nestjs/testing';
import { OdemelerService } from './odemeler.service';

describe('OdemelerService', () => {
  let service: OdemelerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OdemelerService],
    }).compile();

    service = module.get<OdemelerService>(OdemelerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
