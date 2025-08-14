import { Test, TestingModule } from '@nestjs/testing';
import { SozlesmelerService } from './sozlesmeler.service';

describe('SozlesmelerService', () => {
  let service: SozlesmelerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SozlesmelerService],
    }).compile();

    service = module.get<SozlesmelerService>(SozlesmelerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
