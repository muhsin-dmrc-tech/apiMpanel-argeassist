import { Test, TestingModule } from '@nestjs/testing';
import { ProjelerService } from './projeler.service';

describe('ProjelerService', () => {
  let service: ProjelerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjelerService],
    }).compile();

    service = module.get<ProjelerService>(ProjelerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
